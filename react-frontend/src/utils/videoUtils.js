/**
 * Normalizes video input.
 *
 * Supports:
 * - Plain URLs
 * - Old iframe HTML stored in the database
 * - Accidentally quoted URLs
 */
export const normalizeVideoInput = (value = "") => {
  if (!value || typeof value !== "string") {
    return "";
  }

  let videoValue = value.trim();

  // Remove accidental wrapping quotes
  if (
    (videoValue.startsWith('"') && videoValue.endsWith('"')) ||
    (videoValue.startsWith("'") && videoValue.endsWith("'"))
  ) {
    videoValue = videoValue.slice(1, -1).trim();
  }

  // Backward compatibility:
  // If old database record contains iframe HTML, extract only src.
  if (videoValue.toLowerCase().includes("<iframe")) {
    const srcMatch = videoValue.match(
      /<iframe[^>]+src=["']([^"']+)["'][^>]*>/i,
    );

    if (srcMatch?.[1]) {
      videoValue = srcMatch[1].trim();
    }
  }

  // Allow users to paste www.youtube.com/... without https://
  if (videoValue.startsWith("www.")) {
    videoValue = `https://${videoValue}`;
  }

  return videoValue;
};

const getYouTubeId = (url) => {
  const hostname = url.hostname.toLowerCase().replace("www.", "");

  // youtu.be/VIDEO_ID
  if (hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] || null;
  }

  if (
    hostname === "youtube.com" ||
    hostname === "m.youtube.com" ||
    hostname === "music.youtube.com" ||
    hostname === "youtube-nocookie.com"
  ) {
    // youtube.com/watch?v=VIDEO_ID
    const queryId = url.searchParams.get("v");

    if (queryId) {
      return queryId;
    }

    const parts = url.pathname.split("/").filter(Boolean);

    // youtube.com/embed/VIDEO_ID
    // youtube.com/shorts/VIDEO_ID
    // youtube.com/live/VIDEO_ID
    if (
      ["embed", "shorts", "live"].includes(parts[0]) &&
      parts[1]
    ) {
      return parts[1];
    }
  }

  return null;
};

const getVimeoId = (url) => {
  const hostname = url.hostname.toLowerCase().replace("www.", "");

  if (
    hostname !== "vimeo.com" &&
    hostname !== "player.vimeo.com"
  ) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);

  // player.vimeo.com/video/123456
  if (parts[0] === "video" && parts[1]) {
    return parts[1];
  }

  // vimeo.com/123456
  const numericPart = parts.find((part) => /^\d+$/.test(part));

  return numericPart || null;
};

const getLoomId = (url) => {
  const hostname = url.hostname.toLowerCase().replace("www.", "");

  if (hostname !== "loom.com") {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);

  // loom.com/share/ID
  // loom.com/embed/ID
  if (
    ["share", "embed"].includes(parts[0]) &&
    parts[1]
  ) {
    return parts[1];
  }

  return null;
};

const getDailymotionId = (url) => {
  const hostname = url.hostname.toLowerCase().replace("www.", "");

  if (hostname === "dai.ly") {
    return url.pathname.split("/").filter(Boolean)[0] || null;
  }

  if (hostname === "dailymotion.com") {
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "video" && parts[1]) {
      return parts[1].split("_")[0];
    }

    if (parts[0] === "embed" && parts[1] === "video" && parts[2]) {
      return parts[2];
    }
  }

  return null;
};

const getGoogleDriveId = (url) => {
  const hostname = url.hostname.toLowerCase();

  if (!hostname.includes("drive.google.com")) {
    return null;
  }

  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);

  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  const idFromQuery = url.searchParams.get("id");

  return idFromQuery || null;
};

const isDirectVideoUrl = (url) => {
  const pathname = url.pathname.toLowerCase();

  return /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(pathname);
};

/**
 * Returns information required to display the video.
 */
export const getVideoInfo = (value = "") => {
  const normalizedUrl = normalizeVideoInput(value);

  if (!normalizedUrl) {
    return {
      valid: false,
      empty: true,
      type: "empty",
      provider: "",
      originalUrl: "",
      embedUrl: "",
    };
  }

  let url;

  try {
    url = new URL(normalizedUrl);
  } catch (error) {
    return {
      valid: false,
      empty: false,
      type: "invalid",
      provider: "",
      originalUrl: normalizedUrl,
      embedUrl: "",
      message: "Please enter a valid video URL.",
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return {
      valid: false,
      empty: false,
      type: "invalid",
      provider: "",
      originalUrl: normalizedUrl,
      embedUrl: "",
      message: "Only HTTP or HTTPS video URLs are supported.",
    };
  }

  /*
   * YouTube
   */
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return {
      valid: true,
      type: "iframe",
      provider: "YouTube",
      originalUrl: normalizedUrl,
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(
        youtubeId,
      )}`,
    };
  }

  /*
   * Vimeo
   */
  const vimeoId = getVimeoId(url);

  if (vimeoId) {
    return {
      valid: true,
      type: "iframe",
      provider: "Vimeo",
      originalUrl: normalizedUrl,
      embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(
        vimeoId,
      )}`,
    };
  }

  /*
   * Loom
   */
  const loomId = getLoomId(url);

  if (loomId) {
    return {
      valid: true,
      type: "iframe",
      provider: "Loom",
      originalUrl: normalizedUrl,
      embedUrl: `https://www.loom.com/embed/${encodeURIComponent(
        loomId,
      )}`,
    };
  }

  /*
   * Dailymotion
   */
  const dailymotionId = getDailymotionId(url);

  if (dailymotionId) {
    return {
      valid: true,
      type: "iframe",
      provider: "Dailymotion",
      originalUrl: normalizedUrl,
      embedUrl: `https://www.dailymotion.com/embed/video/${encodeURIComponent(
        dailymotionId,
      )}`,
    };
  }

  /*
   * Google Drive
   */
  const googleDriveId = getGoogleDriveId(url);

  if (googleDriveId) {
    return {
      valid: true,
      type: "iframe",
      provider: "Google Drive",
      originalUrl: normalizedUrl,
      embedUrl: `https://drive.google.com/file/d/${encodeURIComponent(
        googleDriveId,
      )}/preview`,
    };
  }

  /*
   * Direct video file
   */
  if (isDirectVideoUrl(url)) {
    return {
      valid: true,
      type: "video",
      provider: "Direct Video",
      originalUrl: normalizedUrl,
      embedUrl: normalizedUrl,
    };
  }

  /*
   * Other URLs.
   *
   * We accept them, but we cannot guarantee that another website
   * allows iframe embedding because X-Frame-Options / CSP can block it.
   */
  return {
    valid: true,
    type: "external",
    provider: "External Video",
    originalUrl: normalizedUrl,
    embedUrl: normalizedUrl,
  };
};