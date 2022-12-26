import React from "react";

const tagContainerStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid gray",
  borderRadius: 6,
  padding: "1px 8px",
  marginRight: 10,
  fontSize: 14
};

const tagTextStyle = {
  marginLeft: 6
};

export default function StreamingModes({ wifi = false, bluetooth = false }) {
  if (!wifi && !bluetooth) {
    return null;
  }

  return (
    <div style={{ marginBottom: 15 }}>
      <span style={{ marginRight: 10 }}>Streaming modes:</span>
      {wifi ? (
        <span style={tagContainerStyle}>
          <WifiIcon />
          <span style={tagTextStyle}>Wi-Fi</span>
        </span>
      ) : null}
      {bluetooth ? (
        <span style={tagContainerStyle}>
          <BluetoothIcon />
          <span style={tagTextStyle}>Bluetooth</span>
        </span>
      ) : null}
    </div>
  );
}

function WifiIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-wifi"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
  );
}

function BluetoothIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-bluetooth"
    >
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
    </svg>
  );
}
