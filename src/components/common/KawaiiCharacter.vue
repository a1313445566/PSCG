<template>
  <div class="kawaii-wrapper" :class="[mood, { 'is-animating': isAnimating }]">
    <svg
      class="kawaii-svg"
      :width="size"
      :height="size"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- ===== 宇航员 Astronaut ===== -->
      <g v-if="character === 'astronaut'">
        <ellipse
          cx="100"
          cy="150"
          rx="45"
          ry="35"
          :fill="color"
          opacity="0.9"
          class="kawaii-body"
        />
        <circle cx="100" cy="85" r="55" :fill="color" class="kawaii-head" />
        <circle cx="100" cy="85" r="42" fill="#E8F4FD" class="helmet-glass" />
        <g class="kawaii-face">
          <g v-if="mood === 'sad'" class="eyes-sad">
            <ellipse cx="85" cy="82" rx="8" ry="10" fill="#2D3748" />
            <ellipse cx="115" cy="82" rx="8" ry="10" fill="#2D3748" />
          </g>
          <g v-else-if="mood === 'shocked'" class="eyes-shocked">
            <circle cx="85" cy="80" r="12" fill="#2D3748" />
            <circle cx="115" cy="80" r="12" fill="#2D3748" />
            <circle cx="88" cy="77" r="4" fill="white" />
            <circle cx="118" cy="77" r="4" fill="white" />
          </g>
          <g v-else-if="mood === 'ko'" class="eyes-ko">
            <line
              x1="78"
              y1="80"
              x2="92"
              y2="80"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
            <line
              x1="108"
              y1="80"
              x2="122"
              y2="80"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
          </g>
          <g v-else class="eyes-normal">
            <ellipse cx="85" cy="82" rx="7" ry="9" fill="#2D3748" />
            <ellipse cx="115" cy="82" rx="7" ry="9" fill="#2D3748" />
            <circle v-if="mood !== 'lovestruck'" cx="87" cy="79" r="3" fill="white" />
            <circle v-if="mood !== 'lovestruck'" cx="117" cy="79" r="3" fill="white" />
          </g>
          <g v-if="mood === 'lovestruck'" class="hearts">
            <path
              d="M78 68 c0-4 3-7 6-7 s6 3 6 7 c0 5 -6 10 -6 12 c0-2 -6-7 -6-12 z"
              fill="#F687B3"
              transform="scale(0.6) translate(50 100)"
            />
            <path
              d="M140 68 c0-4 3-7 6-7 s6 3 6 7 c0 5 -6 10 -6 12 c0-2 -6-7 -6-12 z"
              fill="#F687B3"
              transform="scale(0.6) translate(95 100)"
            />
          </g>
          <ellipse
            v-if="mood === 'blissful' || mood === 'happy' || mood === 'excited'"
            cx="75"
            cy="96"
            rx="8"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <ellipse
            v-if="mood === 'blissful' || mood === 'happy' || mood === 'excited'"
            cx="125"
            cy="96"
            rx="8"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <path
            v-if="mood === 'sad'"
            d="M85 102 Q100 95 115 102"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'shocked'"
            d="M92 104 L108 104"
            stroke="#2D3748"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <ellipse v-else-if="mood === 'ko'" cx="100" cy="103" rx="6" ry="4" fill="#2D3748" />
          <path
            v-else-if="mood === 'lovestruck'"
            d="M88 100 Q100 112 112 100"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'excited'"
            d="M80 100 Q100 120 120 100"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="#F687B3"
            stroke-linecap="round"
          />
          <path
            v-else
            d="M84 100 Q100 114 116 100"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
        </g>
        <rect x="70" y="145" width="12" height="20" rx="6" :fill="color" opacity="0.8" />
        <rect x="118" y="145" width="12" height="20" rx="6" :fill="color" opacity="0.8" />
        <ellipse cx="55" cy="60" rx="15" ry="10" :fill="color" opacity="0.6" class="antenna" />
        <circle cx="55" cy="52" r="5" fill="#FFD166" class="antenna-light" />
      </g>

      <!-- ===== 小猫 Cat ===== -->
      <g v-else-if="character === 'cat'">
        <ellipse cx="100" cy="148" rx="48" ry="38" :fill="color" class="kawaii-body" />
        <polygon points="55,55 70,90 40,80" :fill="color" class="ear ear-left" />
        <polygon points="145,55 130,90 160,80" :fill="color" class="ear ear-right" />
        <polygon points="60,62 70,85 48,78" :fill="innerColor" class="ear-inner-left" />
        <polygon points="140,62 130,85 152,78" :fill="innerColor" class="ear-inner-right" />
        <ellipse cx="100" cy="90" rx="52" ry="45" :fill="color" class="kawaii-head" />
        <g class="kawaii-face">
          <g v-if="mood === 'sad'" class="eyes-sad">
            <ellipse cx="82" cy="85" rx="7" ry="10" fill="#2D3748" />
            <ellipse cx="118" cy="85" rx="7" ry="10" fill="#2D3748" />
          </g>
          <g v-else-if="mood === 'shocked'" class="eyes-shocked">
            <circle cx="82" cy="83" r="11" fill="#2D3748" />
            <circle cx="118" cy="83" r="11" fill="#2D3748" />
            <circle cx="85" cy="80" r="4" fill="white" />
            <circle cx="121" cy="80" r="4" fill="white" />
          </g>
          <g v-else-if="mood === 'ko'" class="eyes-ko">
            <line
              x1="74"
              y1="85"
              x2="90"
              y2="85"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
            <line
              x1="110"
              y1="85"
              x2="126"
              y2="85"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
          </g>
          <g v-else class="eyes-normal">
            <ellipse cx="82" cy="85" rx="6" ry="10" fill="#2D3748" />
            <ellipse cx="118" cy="85" rx="6" ry="10" fill="#2D3748" />
            <circle v-if="mood !== 'lovestruck'" cx="84" cy="81" r="3" fill="white" />
            <circle v-if="mood !== 'lovestruck'" cx="120" cy="81" r="3" fill="white" />
          </g>
          <g v-if="mood === 'lovestruck'" class="hearts">
            <path
              d="M74 72 c0-3 2.5-5.5 5.5-5.5 s5.5 2.5 5.5 5.5 c0 4 -5.5 8 -5.5 9.5 c0-1.5 -5.5-5.5 -5.5-9.5 z"
              fill="#F687B3"
              transform="scale(0.55)"
            />
            <path
              d="M134 72 c0-3 2.5-5.5 5.5-5.5 s5.5 2.5 5.5 5.5 c0 4 -5.5 8 -5.5 9.5 c0-1.5 -5.5-5.5 -5.5-9.5 z"
              fill="#F687B3"
              transform="scale(0.55)"
            />
          </g>
          <ellipse
            v-if="mood !== 'sad' && mood !== 'shocked' && mood !== 'ko'"
            cx="72"
            cy="100"
            rx="9"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <ellipse
            v-if="mood !== 'sad' && mood !== 'shocked' && mood !== 'ko'"
            cx="128"
            cy="100"
            rx="9"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <ellipse cx="100" cy="98" rx="5" ry="3.5" fill="#F6AD55" class="nose" />
          <path
            v-if="mood === 'sad'"
            d="M86 106 Q100 99 114 106"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'shocked'"
            d="M94 107 L106 107"
            stroke="#2D3748"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <ellipse v-else-if="mood === 'ko'" cx="100" cy="107" rx="5" ry="3.5" fill="#2D3748" />
          <path
            v-else-if="mood === 'lovestruck'"
            d="M89 104 Q100 115 111 104"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'excited'"
            d="M82 104 Q100 124 118 104"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="#F687B3"
            stroke-linecap="round"
          />
          <path
            v-else
            d="M86 105 Q100 118 114 105"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <line
            v-if="mood !== 'shocked' && mood !== 'ko'"
            x1="100"
            y1="107"
            x2="100"
            y2="113"
            stroke="#2D3748"
            stroke-width="1.5"
          />
          <path
            v-if="mood !== 'shocked' && mood !== 'ko'"
            d="M94 114 Q100 118 106 114"
            stroke="#2D3748"
            stroke-width="1.5"
            fill="none"
          />
        </g>
        <line
          x1="65"
          y1="155"
          x2="55"
          y2="180"
          stroke="#2D3748"
          stroke-width="8"
          stroke-linecap="round"
          opacity="0.3"
        />
        <line
          x1="135"
          y1="155"
          x2="145"
          y2="180"
          stroke="#2D3748"
          stroke-width="8"
          stroke-linecap="round"
          opacity="0.3"
        />
      </g>

      <!-- ===== 小幽灵 Ghost ===== -->
      <g v-else-if="character === 'ghost'">
        <path
          d="M50 150 L50 85 A50 50 0 0 1 150 85 L150 150 Q137.5 138 125 150 Q112.5 162 100 150 Q87.5 138 75 150 Q62.5 162 50 150 Z"
          :fill="color"
          class="kawaii-body"
        />
        <g class="kawaii-face">
          <g v-if="mood === 'sad'" class="eyes-sad">
            <ellipse cx="82" cy="105" rx="7" ry="10" fill="#2D3748" />
            <ellipse cx="118" cy="105" rx="7" ry="10" fill="#2D3748" />
          </g>
          <g v-else-if="mood === 'shocked'" class="eyes-shocked">
            <circle cx="82" cy="103" r="11" fill="#2D3748" />
            <circle cx="118" cy="103" r="11" fill="#2D3748" />
            <circle cx="85" cy="100" r="4" fill="white" />
            <circle cx="121" cy="100" r="4" fill="white" />
          </g>
          <g v-else-if="mood === 'ko'" class="eyes-ko">
            <line
              x1="74"
              y1="105"
              x2="90"
              y2="105"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
            <line
              x1="110"
              y1="105"
              x2="126"
              y2="105"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
          </g>
          <g v-else class="eyes-normal">
            <ellipse cx="82" cy="105" rx="6" ry="10" fill="#2D3748" />
            <ellipse cx="118" cy="105" rx="6" ry="10" fill="#2D3748" />
            <circle v-if="mood !== 'lovestruck'" cx="84" cy="101" r="3" fill="white" />
            <circle v-if="mood !== 'lovestruck'" cx="120" cy="101" r="3" fill="white" />
          </g>
          <g v-if="mood === 'lovestruck'" class="hearts">
            <path
              d="M74 92 c0-3 2.5-5.5 5.5-5.5 s5.5 2.5 5.5 5.5 c0 4 -5.5 8 -5.5 9.5 c0-1.5 -5.5-5.5 -5.5-9.5 z"
              fill="#F687B3"
              transform="scale(0.55)"
            />
            <path
              d="M134 92 c0-3 2.5-5.5 5.5-5.5 s5.5 2.5 5.5 5.5 c0 4 -5.5 8 -5.5 9.5 c0-1.5 -5.5-5.5 -5.5-9.5 z"
              fill="#F687B3"
              transform="scale(0.55)"
            />
          </g>
          <ellipse
            v-if="mood === 'blissful' || mood === 'happy' || mood === 'excited'"
            cx="72"
            cy="122"
            rx="8"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <ellipse
            v-if="mood === 'blissful' || mood === 'happy' || mood === 'excited'"
            cx="128"
            cy="122"
            rx="8"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <path
            v-if="mood === 'sad'"
            d="M86 128 Q100 121 114 128"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'shocked'"
            d="M94 129 L106 129"
            stroke="#2D3748"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <ellipse v-else-if="mood === 'ko'" cx="100" cy="129" rx="5" ry="4" fill="#2D3748" />
          <path
            v-else-if="mood === 'lovestruck'"
            d="M89 126 Q100 137 111 126"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'excited'"
            d="M82 126 Q100 144 118 126"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="#F687B3"
            stroke-linecap="round"
          />
          <path
            v-else
            d="M86 127 Q100 139 114 127"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
        </g>
        <circle cx="70" cy="75" r="8" fill="white" opacity="0.6" class="blush-spot" />
        <circle cx="135" cy="85" r="5" fill="white" opacity="0.4" class="blush-spot" />
      </g>

      <!-- ===== 汉堡 Burger ===== -->
      <g v-else-if="character === 'burger'">
        <path d="M55 165 Q55 145 100 145 Q145 145 145 165 Z" :fill="color" class="bun-top" />
        <rect x="52" y="148" width="96" height="8" rx="4" fill="#90EE90" class="lettuce" />
        <rect x="50" y="156" width="100" height="12" rx="3" fill="#D2691E" class="patty" />
        <rect x="52" y="169" width="96" height="6" rx="3" fill="#FFD700" class="cheese" />
        <path d="M55 178 Q55 195 100 195 Q145 195 145 178 Z" :fill="color" class="bun-bottom" />
        <g class="kawaii-face">
          <g v-if="mood === 'sad'" class="eyes-sad">
            <ellipse cx="85" cy="168" rx="6" ry="8" fill="#2D3748" />
            <ellipse cx="115" cy="168" rx="6" ry="8" fill="#2D3748" />
          </g>
          <g v-else-if="mood === 'shocked'" class="eyes-shocked">
            <circle cx="85" cy="166" r="9" fill="#2D3748" />
            <circle cx="115" cy="166" r="9" fill="#2D3748" />
            <circle cx="88" cy="163" r="3" fill="white" />
            <circle cx="118" cy="163" r="3" fill="white" />
          </g>
          <g v-else-if="mood === 'ko'" class="eyes-ko">
            <line
              x1="78"
              y1="168"
              x2="92"
              y2="168"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
            <line
              x1="108"
              y1="168"
              x2="122"
              y2="168"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
          </g>
          <g v-else class="eyes-normal">
            <ellipse cx="85" cy="168" rx="5" ry="8" fill="#2D3748" />
            <ellipse cx="115" cy="168" rx="5" ry="8" fill="#2D3748" />
            <circle v-if="mood !== 'lovestruck'" cx="87" cy="165" r="2.5" fill="white" />
            <circle v-if="mood !== 'lovestruck'" cx="117" cy="165" r="2.5" fill="white" />
          </g>
          <g v-if="mood === 'lovestruck'" class="hearts">
            <path
              d="M76 156 c0-2.5 2-4.5 4.5-4.5 s4.5 2 4.5 4.5 c0 3.5 -4.5 7 -4.5 8 c0-1 -4.5-4.5 -4.5-8 z"
              fill="#F687B3"
              transform="scale(0.5)"
            />
            <path
              d="M136 156 c0-2.5 2-4.5 4.5-4.5 s4.5 2 4.5 4.5 c0 3.5 -4.5 7 -4.5 8 c0-1 -4.5-4.5 -4.5-8 z"
              fill="#F687B3"
              transform="scale(0.5)"
            />
          </g>
          <path
            v-if="mood === 'sad'"
            d="M88 182 Q100 176 112 182"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'shocked'"
            d="M95 183 L105 183"
            stroke="#2D3748"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <ellipse v-else-if="mood === 'ko'" cx="100" cy="183" rx="4" ry="3" fill="#2D3748" />
          <path
            v-else-if="mood === 'lovestruck'"
            d="M91 180 Q100 189 109 180"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'excited'"
            d="M85 180 Q100 196 115 180"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="#F687B3"
            stroke-linecap="round"
          />
          <path
            v-else
            d="M88 181 Q100 192 112 181"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
        </g>
        <ellipse
          v-for="i in 3"
          :key="'s' + i"
          cx="58"
          cy="142"
          rx="14"
          ry="5"
          :fill="color"
          opacity="0.5"
          class="sesame"
          :transform="`translate(${i * 28}, 0)`"
        />
      </g>

      <!-- ===== 行星 Planet (默认) ===== -->
      <g v-else>
        <circle cx="100" cy="110" r="60" :fill="color" class="planet-body" />
        <circle cx="78" cy="92" r="12" fill="white" opacity="0.25" class="crater crater-1" />
        <circle cx="125" cy="125" r="8" fill="white" opacity="0.15" class="crater crater-2" />
        <circle cx="90" cy="135" r="6" fill="white" opacity="0.2" class="crater crater-3" />
        <ellipse
          cx="100"
          cy="110"
          rx="60"
          ry="16"
          fill="none"
          stroke="white"
          stroke-width="4"
          opacity="0.3"
          transform="rotate(-20 100 110)"
          class="ring"
        />
        <g class="kawaii-face">
          <g v-if="mood === 'sad'" class="eyes-sad">
            <ellipse cx="85" cy="105" rx="7" ry="10" fill="#2D3748" />
            <ellipse cx="115" cy="105" rx="7" ry="10" fill="#2D3748" />
          </g>
          <g v-else-if="mood === 'shocked'" class="eyes-shocked">
            <circle cx="85" cy="103" r="11" fill="#2D3748" />
            <circle cx="115" cy="103" r="11" fill="#2D3748" />
            <circle cx="88" cy="100" r="4" fill="white" />
            <circle cx="118" cy="100" r="4" fill="white" />
          </g>
          <g v-else-if="mood === 'ko'" class="eyes-ko">
            <line
              x1="77"
              y1="105"
              x2="93"
              y2="105"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
            <line
              x1="107"
              y1="105"
              x2="123"
              y2="105"
              stroke="#2D3748"
              stroke-width="3"
              stroke-linecap="round"
            />
          </g>
          <g v-else class="eyes-normal">
            <ellipse cx="85" cy="105" rx="6" ry="10" fill="#2D3748" />
            <ellipse cx="115" cy="105" rx="6" ry="10" fill="#2D3748" />
            <circle v-if="mood !== 'lovestruck'" cx="87" cy="101" r="3" fill="white" />
            <circle v-if="mood !== 'lovestruck'" cx="117" cy="101" r="3" fill="white" />
          </g>
          <g v-if="mood === 'lovestruck'" class="hearts">
            <path
              d="M76 92 c0-3 2.5-5.5 5.5-5.5 s5.5 2.5 5.5 5.5 c0 4 -5.5 8 -5.5 9.5 c0-1.5 -5.5-5.5 -5.5-9.5 z"
              fill="#F687B3"
              transform="scale(0.55)"
            />
            <path
              d="M136 92 c0-3 2.5-5.5 5.5-5.5 s5.5 2.5 5.5 5.5 c0 4 -5.5 8 -5.5 9.5 c0-1.5 -5.5-5.5 -5.5-9.5 z"
              fill="#F687B3"
              transform="scale(0.55)"
            />
          </g>
          <ellipse
            v-if="mood === 'blissful' || mood === 'happy' || mood === 'excited'"
            cx="73"
            cy="123"
            rx="8"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <ellipse
            v-if="mood === 'blissful' || mood === 'happy' || mood === 'excited'"
            cx="127"
            cy="123"
            rx="8"
            ry="5"
            fill="#FC8181"
            opacity="0.5"
          />
          <path
            v-if="mood === 'sad'"
            d="M86 128 Q100 121 114 128"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'shocked'"
            d="M94 129 L106 129"
            stroke="#2D3748"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <ellipse v-else-if="mood === 'ko'" cx="100" cy="129" rx="5" ry="4" fill="#2D3748" />
          <path
            v-else-if="mood === 'lovestruck'"
            d="M89 126 Q100 137 111 126"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-else-if="mood === 'excited'"
            d="M82 126 Q100 146 118 126"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="#F687B3"
            stroke-linecap="round"
          />
          <path
            v-else
            d="M86 127 Q100 141 114 127"
            stroke="#2D3748"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
          />
        </g>
      </g>
    </svg>

    <transition name="bubble-fade">
      <div v-if="showBubble" class="speech-bubble">{{ bubbleText }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  character: {
    type: String,
    default: 'planet',
    validator: v => ['astronaut', 'cat', 'ghost', 'burger', 'planet'].includes(v)
  },
  mood: {
    type: String,
    default: 'happy',
    validator: v => ['shocked', 'happy', 'blissful', 'lovestruck', 'excited', 'ko'].includes(v)
  },
  size: {
    type: [Number, String],
    default: 200
  },
  color: {
    type: String,
    default: '#A6E191'
  },
  innerColor: {
    type: String,
    default: '#F687B3'
  },
  showBubble: {
    type: Boolean,
    default: false
  },
  bubbleText: {
    type: String,
    default: ''
  }
})

const isAnimating = ref(false)

watch(
  () => props.mood,
  () => {
    isAnimating.value = true
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }
)

onMounted(() => {
  setInterval(() => {
    if (!isAnimating.value && props.mood === 'happy') {
      const wrapper = document.querySelector('.kawaii-wrapper')
      if (wrapper) {
        wrapper.style.transform = 'translateY(-3px)'
        setTimeout(() => {
          wrapper.style.transform = ''
        }, 300)
      }
    }
  }, 3000)
})
</script>

<style scoped lang="scss">
@use '../../styles/scss/abstracts' as *;

.kawaii-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.is-animating {
    animation: kawaii-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &.sad {
    .kawaii-head,
    .kawaii-body,
    .planet-body,
    .bun-top,
    .bun-bottom {
      filter: brightness(0.95);
    }
  }

  &.shocked {
    animation: kawaii-shake 0.4s ease-in-out;
  }

  &.excited {
    animation: kawaii-wiggle 0.6s ease-in-out infinite;
  }

  &.blissful {
    filter: brightness(1.05);
  }

  &.lovestruck {
    animation: kawaii-pulse 1.5s ease-in-out infinite;
  }
}

@keyframes kawaii-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  30% {
    transform: translateY(-12px) scale(1.05);
  }
  50% {
    transform: translateY(0) scale(1);
  }
  70% {
    transform: translateY(-6px) scale(1.02);
  }
}

@keyframes kawaii-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px) rotate(-3deg);
  }
  75% {
    transform: translateX(5px) rotate(3deg);
  }
}

@keyframes kawaii-wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(8deg);
  }
}

@keyframes kawaii-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.kawaii-svg {
  filter: drop-shadow($shadow-md);

  .kawaii-head,
  .kawaii-body,
  .planet-body,
  .bun-top,
  .bun-bottom,
  .helmet-glass,
  .ear,
  .antenna {
    transition: all 0.3s ease;
  }

  .eyes-normal,
  .eyes-sad,
  .eyes-shocked,
  .eyes-ko {
    transition: all 0.3s ease;
  }

  .hearts {
    animation: heart-beat 1.2s ease-in-out infinite;
  }

  @keyframes heart-beat {
    0%,
    100% {
      transform: scale(1);
    }
    15% {
      transform: scale(1.15);
    }
    30% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.1);
    }
  }

  .ear-left,
  .ear-right {
    transition: transform 0.4s ease;
  }

  &:hover .ear-left {
    transform: rotate(-10deg);
  }

  &:hover .ear-right {
    transform: rotate(10deg);
  }

  .antenna {
    animation: antenna-swing 3s ease-in-out infinite;
    transform-origin: bottom;
  }

  @keyframes antenna-swing {
    0%,
    100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-12deg);
    }
    75% {
      transform: rotate(12deg);
    }
  }

  .crater {
    animation: twinkle 4s ease-in-out infinite;
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.15;
    }
    50% {
      opacity: 0.3;
    }
  }

  .antenna-light {
    animation: blink-light 2s ease-in-out infinite;
  }

  @keyframes blink-light {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .ring {
    animation: ring-spin 20s linear infinite;
    transform-origin: center;
  }

  @keyframes ring-spin {
    from {
      transform: rotate(-20deg);
    }
    to {
      transform: rotate(340deg);
    }
  }

  .lettuce,
  .cheese {
    transition: all 0.3s ease;
  }

  .blush-spot {
    animation: float-spot 4s ease-in-out infinite;
  }

  @keyframes float-spot {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-4px);
      opacity: 0.6;
    }
  }
}

.speech-bubble {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background-color: $card-background;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  box-shadow: $shadow-md;
  font-size: 0.85rem;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 9px solid $card-background;
  }
}

.bubble-fade-enter-active,
.bubble-fade-leave-active {
  transition: all 0.3s ease;
}

.bubble-fade-enter-from,
.bubble-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
