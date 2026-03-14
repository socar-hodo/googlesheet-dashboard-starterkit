"use client";

interface UpdateTimestampProps {
  fetchedAt: string;
}

function getRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60000) {
    return "방금 전";
  }
  if (diffMs < 3600000) {
    return `${Math.floor(diffMs / 60000)}분 전`;
  }
  if (diffMs < 86400000) {
    return `${Math.floor(diffMs / 3600000)}시간 전`;
  }
  return `${Math.floor(diffMs / 86400000)}일 전`;
}

function getAbsoluteTime(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timePart = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

export function UpdateTimestamp({ fetchedAt }: UpdateTimestampProps) {
  const relativeTime = getRelativeTime(fetchedAt);
  const absoluteTime = getAbsoluteTime(fetchedAt);

  return (
    <p suppressHydrationWarning className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-[#CBD1DC] backdrop-blur-xl">
      마지막 업데이트: {relativeTime} ({absoluteTime})
    </p>
  );
}
