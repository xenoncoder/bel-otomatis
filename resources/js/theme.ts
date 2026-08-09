import { createSystem, defaultConfig, defineTokens, defineSemanticTokens } from "@chakra-ui/react";

const tokens = defineTokens({
  colors: {
    saweria: {
      purple: { light: { value: "#c2ace6" }, normal: { value: "#a683dd" }, dark: { value: "#7e67a1" } },
      blue: { light: { value: "#A1C8FF" }, normal: { value: "#108ee9" } },
      pink: { light: { value: "#ffbdc4" }, normal: { value: "#fe98a3" }, dark: { value: "#ba797f" } },
      yellow: { light: { value: "#fac76c" }, normal: { value: "#faae2b" }, dark: { value: "#b68228" } },
      green: { light: { value: "#b2e0e6" }, normal: { value: "#8bd3dd" }, dark: { value: "#6e9ba1" } },
      mustard: { value: "#F7D7B3" },
    },
    blackish: { value: "#333" },
    whitish: { value: "#f2f7f5" },
    peach: { value: "#FFD8BC" },
    brand: {
      50: { value: "#f5f0fa" }, 100: { value: "#e6d9f5" }, 200: { value: "#d4c2ee" },
      300: { value: "#c2ace6" }, 400: { value: "#b89be0" }, 500: { value: "#a683dd" },
      600: { value: "#8e6cc4" }, 700: { value: "#7e67a1" }, 800: { value: "#5f4d7c" }, 900: { value: "#403356" },
    },
    green: {
      50: { value: "#edf8f9" }, 100: { value: "#d2eef1" }, 200: { value: "#b2e0e6" },
      300: { value: "#9fd9e1" }, 400: { value: "#8bd3dd" }, 500: { value: "#7ac4d0" },
      600: { value: "#6e9ba1" }, 700: { value: "#547a7f" }, 800: { value: "#3d585c" }, 900: { value: "#273739" },
    },
    pink: {
      50: { value: "#fff0f2" }, 100: { value: "#ffdde1" }, 200: { value: "#ffbdc4" },
      300: { value: "#feaab3" }, 400: { value: "#fe98a3" }, 500: { value: "#f47e8a" },
      600: { value: "#ba797f" }, 700: { value: "#945e63" }, 800: { value: "#6f474b" }, 900: { value: "#4d3235" },
    },
    yellow: {
      50: { value: "#fef5e0" }, 100: { value: "#fde9b8" }, 200: { value: "#fac76c" },
      300: { value: "#fabb45" }, 400: { value: "#faae2b" }, 500: { value: "#e89e1f" },
      600: { value: "#b68228" }, 700: { value: "#8a631d" }, 800: { value: "#5e4414" }, 900: { value: "#38280c" },
    },
    blue: {
      50: { value: "#eaf4ff" }, 100: { value: "#d0e6ff" }, 200: { value: "#A1C8FF" },
      300: { value: "#7ab2f5" }, 400: { value: "#3a9eee" }, 500: { value: "#108ee9" },
      600: { value: "#0b6cb3" }, 700: { value: "#085288" }, 800: { value: "#05395e" }, 900: { value: "#032338" },
    },
  },
  fonts: {
    heading: { value: "'Comfortaa', sans-serif" },
    body: { value: "'IBM Plex Mono', monospace" },
    mono: { value: "'IBM Plex Mono', monospace" },
  },
  radii: {
    md: { value: "0.375rem" },
    lg: { value: "0.75rem" },
    xl: { value: "1rem" },
    "2xl": { value: "1.5rem" },
  },
  shadows: {
    buttonRaised: { value: "0.4rem 0.4rem 0 #222" },
    buttonPressed: { value: "0.1rem 0.1rem 0 #222" },
    raised: { value: "0.6rem 0.6rem 0 #222" },
    pressed: { value: "0.2rem 0.2rem 0 #222" },
    outline: { value: "0 0 0 3px rgba(166,131,221,0.6)" },
  },
});

const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      DEFAULT: { value: { base: "#f3eef9", _dark: "#1a1426" } },
      subtle: { value: { base: "#ede4f7", _dark: "#221a33" } },
      card: { value: { base: "#f8f5fc", _dark: "#221a33" } },
      panel: { value: { base: "#ffffff", _dark: "#2d2245" } },
      muted: { value: { base: "#ede4f7", _dark: "#2d2245" } },
      hover: { value: { base: "#ede4f7", _dark: "#2d2245" } },
    },
    fg: {
      DEFAULT: { value: { base: "#1a202c", _dark: "#f5f3ff" } },
      muted: { value: { base: "#3d3d3d", _dark: "#c4b8d8" } },
      subtle: { value: { base: "#6b5b82", _dark: "#9b8bb5" } },
      heading: { value: { base: "#1a1a1a", _dark: "#ffffff" } },
    },
    border: {
      DEFAULT: { value: { base: "#000", _dark: "#5a4a7a" } },
      subtle: { value: { base: "#000", _dark: "#5a4a7a" } },
      strong: { value: { base: "#000", _dark: "#5a4a7a" } },
    },
  },
  shadows: {
    card: { value: { base: "0.6rem 0.6rem 0 #222", _dark: "0.6rem 0.6rem 0 #0d0817" } },
    cardHover: { value: { base: "0.2rem 0.2rem 0 #222", _dark: "0.2rem 0.2rem 0 #0d0817" } },
  },
});

export const system = createSystem(defaultConfig, {
  theme: {
    tokens,
    semanticTokens,
    recipes: {
      button: {
        base: {
          borderRadius: "md",
          fontWeight: "600",
          fontFamily: "body",
          fontSize: "lg",
          borderWidth: "1px",
          borderColor: "border.DEFAULT",
          boxShadow: "pressed",
          color: "#000",
          px: "5",
          py: "2",
          transitionProperty: "box-shadow, transform",
          transitionDuration: "fast",
          _hover: { transform: "translate(-0.05rem, -0.05rem)", boxShadow: "0.3rem 0.3rem 0 #222" },
          _active: { boxShadow: "buttonPressed", transform: "translate(0.1rem, 0.1rem)" },
          _disabled: { opacity: "0.5", cursor: "not-allowed", boxShadow: "pressed", transform: "none" },
        },
        variants: {
          variant: {
            solid: {},
            outline: {
              bg: "transparent", color: "fg.DEFAULT", borderColor: "border.DEFAULT",
              boxShadow: "buttonRaised",
              _hover: { bg: "bg.hover", transform: "translate(-0.05rem, -0.05rem)", boxShadow: "0.45rem 0.45rem 0 #222" },
              _active: { boxShadow: "buttonPressed", transform: "translate(0.3rem, 0.3rem)" },
            },
            ghost: {
              bg: "transparent", borderColor: "transparent", boxShadow: "none", color: "fg.muted",
              _hover: { bg: "bg.hover", boxShadow: "none", transform: "none" },
              _active: { boxShadow: "none", transform: "none" },
            },
            subtle: {
              borderColor: "border.DEFAULT", boxShadow: "none",
              _hover: { boxShadow: "none", transform: "none" },
              _active: { boxShadow: "none", transform: "none" },
            },
          },
          size: {
            xs: { fontSize: "xs", px: "3", py: "1" },
            sm: { fontSize: "sm", px: "4", py: "1.5" },
            md: { fontSize: "md", px: "5", py: "2" },
            lg: { fontSize: "lg", px: "6", py: "2.5" },
            xl: { fontSize: "xl", px: "7", py: "3" },
          },
        },
      },
    },
  },
});

export default system;
