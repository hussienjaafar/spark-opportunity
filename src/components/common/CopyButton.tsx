import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={copied ? "secondary" : "default"}
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(()=>setCopied(false), 1200);
      }}
    >
      {copied ? "Copied" : "Copy SQL"}
    </Button>
  );
}
