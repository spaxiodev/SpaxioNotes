import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ${className}`}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="h-8 w-8 object-contain"
        height={32}
        src="/logo.png"
        width={32}
      />
    </span>
  );
}
