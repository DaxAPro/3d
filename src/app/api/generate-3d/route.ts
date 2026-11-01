import { NextRequest, NextResponse } from "next/server";

// Replicate Configuration
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";
// State-of-the-art TRELLIS model version with 2K texture & normal map synthesis
const TRELLIS_MODEL_VERSION =
  "4876f2a8da1c544772dffa32e8889da4a1bab58fe9462c5e78f07e0eba5a9a4e";

// Meshy Configuration (optional alternative provider)
const MESHY_API_URL = "https://api.meshy.ai/v2/image-to-3d";

/**
 * POST /api/generate-3d
 * Dispatches 2D image with high-resolution PBR & accurate color injection parameters.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const provider = (request.headers.get("x-provider") || "replicate").toLowerCase();

    // High quality config from client settings or defaults
    const textureSize = parseInt(formData.get("texture_size") as string) || 2048;
    const meshQuality = (formData.get("mesh_quality") as string) || "ultra";
    const meshSimplify = meshQuality === "ultra" ? 0.98 : meshQuality === "high" ? 0.95 : 0.90;
    const accurateColors = formData.get("accurate_colors") !== "false";
    const enablePbr = formData.get("enable_pbr") !== "false";

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided in request." },
        { status: 400 }
      );
    }

    // Convert image file to base64 Data URI
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = imageFile.type || "image/png";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // ──────────────────────────────────────────────
    // PROVIDER 1: REPLICATE (TRELLIS - Ultra Quality)
    // ──────────────────────────────────────────────
    if (provider === "replicate") {
      const apiToken =
        request.headers.get("x-replicate-token") ||
        process.env.REPLICATE_API_TOKEN;

      if (!apiToken) {
        return NextResponse.json(
          {
            error:
              "Replicate API Token is missing. Set it in the /settings page or in .env.local file.",
          },
          { status: 401 }
        );
      }

      // Payload strictly optimized for maximum geometric sharpness, 2K textures, and faithful albedo color accuracy
      const replicatePayload = {
        version: TRELLIS_MODEL_VERSION,
        input: {
          image: dataUri,
          // Resolution & Texture Quality (Ultra 2K resolution)
          texture_size: textureSize, // 2048 x 2048
          // Mesh decimation ratio (0.98 retains high polygon fidelity)
          mesh_simplify: meshSimplify,
          // Structure sampling & guidance for accurate original shape/color matching
          ss_guidance_strength: accurateColors ? 8.0 : 7.5,
          ss_sampling_steps: 25, // Deep sampling for fine geometric features
          // Latent guidance for high-fidelity surface colors and textures
          slat_guidance_strength: accurateColors ? 3.5 : 3.0,
          slat_sampling_steps: 25,
          // PBR and texture generation flags
          generate_color: true,
          generate_normal: enablePbr,
          generate_model: true,
        },
      };

      const response = await fetch(REPLICATE_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          Prefer: "respond-async",
        },
        body: JSON.stringify(replicatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Replicate API Error:", errorData);
        return NextResponse.json(
          {
            error:
              errorData.detail ||
              errorData.title ||
              "Replicate prediction failed. Please verify your token in Settings.",
          },
          { status: response.status }
        );
      }

      const prediction = await response.json();

      if (prediction.status === "succeeded" && prediction.output) {
        const modelUrl = extractGlbUrl(prediction.output);
        return NextResponse.json({
          status: "succeeded",
          modelUrl,
          provider: "replicate",
        });
      }

      return NextResponse.json({
        status: prediction.status,
        predictionId: prediction.id,
        provider: "replicate",
      });
    }

    // ──────────────────────────────────────────────
    // PROVIDER 2: MESHY AI
    // ──────────────────────────────────────────────
    if (provider === "meshy") {
      const meshyKey =
        request.headers.get("x-meshy-key") || process.env.MESHY_API_KEY;

      if (!meshyKey) {
        return NextResponse.json(
          {
            error:
              "Meshy API Key missing. Please provide it in the Settings page.",
          },
          { status: 401 }
        );
      }

      const meshyRes = await fetch(MESHY_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${meshyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: dataUri,
          enable_pbr: enablePbr,
          surface_mode: "hard",
          texture_richness: textureSize >= 2048 ? "high" : "medium",
        }),
      });

      if (!meshyRes.ok) {
        const errJson = await meshyRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errJson.message || "Meshy task initiation failed" },
          { status: meshyRes.status }
        );
      }

      const meshyData = await meshyRes.json();
      return NextResponse.json({
        status: "processing",
        predictionId: meshyData.result,
        provider: "meshy",
      });
    }

    return NextResponse.json(
      { error: `Unsupported provider: ${provider}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("POST /api/generate-3d Exception:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/generate-3d?predictionId=xxx
 * Polls status of active 3D generation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get("predictionId");
  const provider = (searchParams.get("provider") || "replicate").toLowerCase();

  if (!predictionId) {
    return NextResponse.json(
      { error: "Missing required predictionId query parameter." },
      { status: 400 }
    );
  }

  try {
    // ──────────────────────────────────────────────
    // POLL REPLICATE
    // ──────────────────────────────────────────────
    if (provider === "replicate") {
      const apiToken =
        request.headers.get("x-replicate-token") ||
        process.env.REPLICATE_API_TOKEN;

      if (!apiToken) {
        return NextResponse.json(
          { error: "Missing Replicate API Token." },
          { status: 401 }
        );
      }

      const response = await fetch(`${REPLICATE_API_URL}/${predictionId}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errJson.detail || "Failed to poll Replicate status." },
          { status: response.status }
        );
      }

      const prediction = await response.json();

      if (prediction.status === "succeeded") {
        const modelUrl = extractGlbUrl(prediction.output);
        if (!modelUrl) {
          return NextResponse.json(
            {
              error:
                "Generation completed but no 3D model .glb URL was found in output.",
              rawOutput: prediction.output,
            },
            { status: 500 }
          );
        }
        return NextResponse.json({ status: "succeeded", modelUrl });
      }

      if (prediction.status === "failed") {
        return NextResponse.json(
          {
            status: "failed",
            error: prediction.error || "3D Model generation failed on Replicate.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: prediction.status, // "starting" | "processing"
      });
    }

    // ──────────────────────────────────────────────
    // POLL MESHY
    // ──────────────────────────────────────────────
    if (provider === "meshy") {
      const meshyKey =
        request.headers.get("x-meshy-key") || process.env.MESHY_API_KEY;

      const meshyRes = await fetch(`${MESHY_API_URL}/${predictionId}`, {
        headers: {
          Authorization: `Bearer ${meshyKey}`,
        },
      });

      if (!meshyRes.ok) {
        return NextResponse.json(
          { error: "Failed to poll Meshy status." },
          { status: meshyRes.status }
        );
      }

      const data = await meshyRes.json();
      if (data.status === "SUCCEEDED") {
        return NextResponse.json({
          status: "succeeded",
          modelUrl: data.model_urls?.glb,
        });
      }
      if (data.status === "FAILED") {
        return NextResponse.json(
          { status: "failed", error: data.task_error?.message || "Meshy failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({ status: "processing" });
    }

    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("GET /api/generate-3d Exception:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Extracts the .glb direct download link from arbitrary Replicate output structures
 */
function extractGlbUrl(output: unknown): string | null {
  if (!output) return null;

  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output)) {
    const glb = output.find(
      (item) => typeof item === "string" && item.toLowerCase().includes(".glb")
    );
    if (glb) return glb as string;
    if (typeof output[0] === "string") return output[0];
  }

  if (typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;
    for (const key of ["model_file", "glb", "mesh", "model", "url"]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }
  }

  return null;
}
