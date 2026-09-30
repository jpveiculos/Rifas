import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1b2a",
          borderRadius: 36
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 100,
            borderRadius: 24,
            background: "#ffffff",
            boxShadow: "0 10px 0 #07111d"
          }}
        >
          <span
            style={{
              fontSize: 31,
              fontWeight: 900,
              color: "#0d1b2a",
              letterSpacing: -2
            }}
          >
            Rifas
          </span>
          <span
            style={{
              fontSize: 31,
              fontWeight: 900,
              color: "#ffbd00",
              letterSpacing: -2
            }}
          >
            .TOP
          </span>
        </div>
      </div>
    ),
    size
  );
}
