import { PUBLISHER } from "@/lib/constants/publisher";
import { SITE_NAME } from "@/lib/seo";

interface PublishedByProps {
  className?: string;
  linkClassName?: string;
}

export function PublishedBy({ className, linkClassName }: PublishedByProps) {
  return (
    <p className={className}>
      {SITE_NAME} is published by{" "}
      <a href={PUBLISHER.url} className={linkClassName} rel="noopener">
        {PUBLISHER.name}
      </a>
      .
    </p>
  );
}
