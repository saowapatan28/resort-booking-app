"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

/**
 * Thin wrapper around react-signature-canvas.
 * Exposes { clear(), isEmpty(), getDataUrl() } via ref.
 */
const SignaturePad = forwardRef(function SignaturePad({ label = "กรุณาเซ็นชื่อ" }, ref) {
  const sigRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clear: () => sigRef.current?.clear(),
    isEmpty: () => sigRef.current?.isEmpty() ?? true,
    getDataUrl: () => sigRef.current?.getTrimmedCanvas().toDataURL("image/png"),
  }));

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-600">{label}</label>
      <div className="rounded-lg border-2 border-dashed border-stone-300 bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="#0f172a"
          canvasProps={{ className: "signature-canvas w-full h-48 rounded-lg" }}
        />
      </div>
      <button
        type="button"
        onClick={() => sigRef.current?.clear()}
        className="mt-2 text-xs font-medium text-stone-500 underline hover:text-teal-700"
      >
        ล้างลายเซ็น
      </button>
    </div>
  );
});

export default SignaturePad;
