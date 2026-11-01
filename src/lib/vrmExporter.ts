/**
 * Helper to download a URL as a .glb file
 */
export async function downloadAsGlb(url: string, filename = "model.glb"): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch 3D model buffer");
  const blob = await response.blob();
  triggerDownload(blob, filename, "model/gltf-binary");
}

/**
 * Converts a GLB buffer to a valid VRM format by injecting VRM 0.0 metadata chunk into glTF
 */
export async function downloadAsVrm(url: string, filename = "model.vrm"): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch 3D model buffer");
  const arrayBuffer = await response.arrayBuffer();

  try {
    const vrmBuffer = injectVrmMetadata(arrayBuffer);
    const blob = new Blob([vrmBuffer], { type: "application/octet-stream" });
    triggerDownload(blob, filename, "application/octet-stream");
  } catch (err) {
    console.warn("VRM metadata injection failed, saving raw container as .vrm fallback", err);
    const fallbackBlob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    triggerDownload(fallbackBlob, filename, "application/octet-stream");
  }
}

/**
 * Injects VRM metadata into glTF binary (GLB) structure
 * GLB structure:
 *  - Header (12 bytes): Magic (0x46546C67), Version (2), Length (uint32)
 *  - Chunk 0: Length (uint32), Type (0x4E4F534A 'JSON'), Data (JSON utf-8)
 *  - Chunk 1: Length (uint32), Type (0x004E4942 'BIN\0'), Data (Binary)
 */
function injectVrmMetadata(glbBuffer: ArrayBuffer): ArrayBuffer {
  const dataView = new DataView(glbBuffer);

  // Validate GLB Magic
  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546c67) {
    throw new Error("Invalid GLB header");
  }

  const version = dataView.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`);
  }

  // Chunk 0 (JSON)
  const jsonChunkLength = dataView.getUint32(12, true);
  const jsonChunkType = dataView.getUint32(16, true);
  if (jsonChunkType !== 0x4e4f534a) {
    throw new Error("Chunk 0 is not JSON");
  }

  const jsonBytes = new Uint8Array(glbBuffer, 20, jsonChunkLength);
  const textDecoder = new TextDecoder("utf-8");
  const jsonString = textDecoder.decode(jsonBytes);
  const gltf = JSON.parse(jsonString);

  // Inject VRM extensions
  if (!gltf.extensions) gltf.extensions = {};
  if (!gltf.extensionsUsed) gltf.extensionsUsed = [];

  if (!gltf.extensionsUsed.includes("VRM")) {
    gltf.extensionsUsed.push("VRM");
  }

  // VRM 0.x Metadata
  gltf.extensions.VRM = {
    exporterVersion: "ImageTo3D-VRM-Exporter-1.0",
    specVersion: "0.0",
    meta: {
      title: "AI Generated 3D Asset",
      version: "1.0",
      author: "Image to 3D AI",
      contactInformation: "",
      reference: "",
      allowedUserName: "Everyone",
      violentUssageName: "Allow",
      sexualUssageName: "Allow",
      commercialUssageName: "Allow",
      otherPermissionUrl: "",
      licenseName: "Other",
      otherLicenseUrl: "",
    },
    humanoid: {
      humanBones: [],
      armStretch: 0.05,
      legStretch: 0.05,
      upperArmTwist: 0.5,
      lowerArmTwist: 0.5,
      upperLegTwist: 0.5,
      lowerLegTwist: 0.5,
      feetSpacing: 0,
      hasTranslationDoF: false,
    },
    firstPerson: {
      firstPersonBone: 0,
      firstPersonBoneOffset: { x: 0, y: 0, z: 0 },
      meshAnnotations: [],
      lookAtTypeName: "Default",
      lookAtHorizontalInner: { curve: [0, 0, 0, 1, 1, 1, 1, 0] },
      lookAtHorizontalOuter: { curve: [0, 0, 0, 1, 1, 1, 1, 0] },
      lookAtVerticalDown: { curve: [0, 0, 0, 1, 1, 1, 1, 0] },
      lookAtVerticalUp: { curve: [0, 0, 0, 1, 1, 1, 1, 0] },
    },
    blendShapeMaster: {
      blendShapeGroups: [],
    },
    secondaryAnimation: {
      boneGroups: [],
      colliderGroups: [],
    },
    materialProperties: [],
  };

  // Re-encode JSON
  const textEncoder = new TextEncoder();
  const updatedJsonString = JSON.stringify(gltf);
  let updatedJsonBytes = textEncoder.encode(updatedJsonString);

  // Pad to 4-byte boundary with spaces (0x20)
  const remainder = updatedJsonBytes.length % 4;
  if (remainder !== 0) {
    const padding = 4 - remainder;
    const padded = new Uint8Array(updatedJsonBytes.length + padding);
    padded.set(updatedJsonBytes);
    for (let i = 0; i < padding; i++) {
      padded[updatedJsonBytes.length + i] = 0x20;
    }
    updatedJsonBytes = padded;
  }

  // Chunk 1 (BIN)
  const binChunkOffset = 20 + jsonChunkLength;
  const hasBinChunk = glbBuffer.byteLength > binChunkOffset;

  let binChunkBytes: Uint8Array | null = null;
  let binChunkLength = 0;
  let binChunkType = 0x004e4942; // 'BIN\0'

  if (hasBinChunk) {
    binChunkLength = dataView.getUint32(binChunkOffset, true);
    binChunkType = dataView.getUint32(binChunkOffset + 4, true);
    binChunkBytes = new Uint8Array(glbBuffer, binChunkOffset + 8, binChunkLength);
  }

  // Calculate new total size:
  // 12 (header) + 8 (chunk0 header) + updatedJsonBytes.length + (if BIN: 8 + binChunkLength)
  const newTotalLength =
    12 +
    8 +
    updatedJsonBytes.length +
    (binChunkBytes ? 8 + binChunkBytes.length : 0);

  const outBuffer = new ArrayBuffer(newTotalLength);
  const outView = new DataView(outBuffer);
  const outBytes = new Uint8Array(outBuffer);

  // Write GLB header
  outView.setUint32(0, 0x46546c67, true); // 'glTF'
  outView.setUint32(4, 2, true); // Version 2
  outView.setUint32(8, newTotalLength, true);

  // Write JSON chunk header
  outView.setUint32(12, updatedJsonBytes.length, true);
  outView.setUint32(16, 0x4e4f534a, true); // 'JSON'
  outBytes.set(updatedJsonBytes, 20);

  // Write BIN chunk
  if (binChunkBytes) {
    const binOffset = 20 + updatedJsonBytes.length;
    outView.setUint32(binOffset, binChunkBytes.length, true);
    outView.setUint32(binOffset + 4, binChunkType, true);
    outBytes.set(binChunkBytes, binOffset + 8);
  }

  return outBuffer;
}

function triggerDownload(blob: Blob, filename: string, mimeType: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
