"use client"

import { Monitor, Tablet, Smartphone } from "lucide-react"

type Props = {
  device: "desktop" | "tablet" | "mobile"
  setDevice: (d: "desktop" | "tablet" | "mobile") => void
}

export default function PreviewBar({ device, setDevice }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setDevice("desktop")}
        className={device === "desktop" ? "text-primary" : ""}
      >
        <Monitor className="w-4 h-4" />
      </button>

      <button
        onClick={() => setDevice("tablet")}
        className={device === "tablet" ? "text-primary" : ""}
      >
        <Tablet className="w-4 h-4" />
      </button>

      <button
        onClick={() => setDevice("mobile")}
        className={device === "mobile" ? "text-primary" : ""}
      >
        <Smartphone className="w-4 h-4" />
      </button>
    </div>
  )
}