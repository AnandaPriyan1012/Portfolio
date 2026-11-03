import { useState } from "react";
export default function Signature({ className = "" }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span
      className={`signature-fallback ${className}`}
      aria-label="Ananda Priyan"
    >
      AP
    </span>
  ) : (
    <img
      className={`ap-signature ${className}`}
      src="/media/ap-signature.png"
      alt="Ananda Priyan — AP signature"
      width="96"
      height="64"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
