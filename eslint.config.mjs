import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: ["components/ui/800Path Design System-3/**", "components/ui/design0816/**"],
  },
  ...nextConfig,
];

export default eslintConfig;
