// Original vector illustration. No external image dependency.
export default function VehicleArt({ compact = false }) {
  return (
    <svg
      viewBox="0 0 620 310"
      fill="none"
      aria-hidden="true"
      className={compact ? "vehicle-art compact" : "vehicle-art"}
    >
      <defs>
        <linearGradient
          id="body"
          x1="180"
          y1="90"
          x2="330"
          y2="240"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f4f5ff" />
          <stop offset=".4" stopColor="#d8dbf8" />
          <stop offset="1" stopColor="#9b9ec6" />
        </linearGradient>
        <linearGradient
          id="glass"
          x1="210"
          y1="100"
          x2="370"
          y2="165"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#727991" />
          <stop offset="1" stopColor="#262c49" />
        </linearGradient>
        <linearGradient
          id="front"
          x1="440"
          y1="153"
          x2="440"
          y2="226"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#bfc4e3" />
          <stop offset="1" stopColor="#747caa" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <ellipse
        cx="321"
        cy="249"
        rx="218"
        ry="15"
        fill="#090b22"
        opacity=".44"
        filter="url(#shadow)"
      />
      <path
        d="M87 213 110 151l98-22 61-48 120 4 83 62 59 22 14 48-46 25-350-6Z"
        fill="url(#body)"
      />
      <path d="m110 151 107-12 62-46 102 4 72 54-143 20Z" fill="#e8eafd" />
      <path d="m227 139 57-40 91 4 62 45-133 17Z" fill="url(#glass)" />
      <path d="m330 101 10 58" stroke="#dde1f6" strokeWidth="7" />
      <path d="m116 156 100-12 84 28-17 59-141-6-49-18Z" fill="#cbd0ee" />
      <path
        d="m211 149-4 65m88-37-14 49m-169-52 164 7"
        stroke="#a5abcf"
        strokeWidth="1.5"
      />
      <path d="m307 174 147-20 70 22 10 37-39 22-202 1Z" fill="url(#front)" />
      <path d="m313 170 140-17 70 21-129 22Z" fill="#e7eaff" />
      <path d="m398 201 112-18 6 12-115 17Z" fill="#2e3658" />
      <path d="m413 206 85-13m-81 18 82-14" stroke="#646d91" strokeWidth="2" />
      <path
        d="m322 192 62 8-1 10-61-7Zm190-16 14 5 4 11-15 2Z"
        fill="#efffff"
      />
      <path d="m321 202 61 10m134-17 12-2" stroke="#9bf4eb" strokeWidth="2" />
      <path d="m402 218 78-12 1 12-78 11Z" fill="#151d38" />
      <path d="m429 214 26-4 1 8-26 4Z" fill="#eceeff" />
      <ellipse
        cx="163"
        cy="220"
        rx="26"
        ry="35"
        transform="rotate(-11 163 220)"
        fill="#20253e"
      />
      <ellipse
        cx="163"
        cy="220"
        rx="16"
        ry="24"
        transform="rotate(-11 163 220)"
        fill="#8b91b2"
      />
      <ellipse
        cx="163"
        cy="220"
        rx="9"
        ry="16"
        transform="rotate(-11 163 220)"
        fill="#333b58"
      />
      <path
        d="m163 198 0 43m-12-31 23 18m-25-4 24-9"
        stroke="#d8dbf1"
        strokeWidth="2"
      />
      <ellipse
        cx="340"
        cy="228"
        rx="28"
        ry="36"
        transform="rotate(-9 340 228)"
        fill="#1e243d"
      />
      <ellipse
        cx="340"
        cy="228"
        rx="18"
        ry="25"
        transform="rotate(-9 340 228)"
        fill="#8e96b9"
      />
      <ellipse
        cx="340"
        cy="228"
        rx="10"
        ry="16"
        transform="rotate(-9 340 228)"
        fill="#353e5e"
      />
      <path
        d="m340 204 0 47m-13-35 26 24m-27-10 25-8"
        stroke="#d8def5"
        strokeWidth="2"
      />
      <path
        d="m244 174 16 1m-134-10 12 1"
        stroke="#7882ac"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m286 158 11-12 17 3 4 9-23 6Z" fill="#c5cbed" />
    </svg>
  );
}
