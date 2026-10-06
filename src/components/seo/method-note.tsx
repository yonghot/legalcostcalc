interface MethodNoteProps {
  scope?: string;
  className?: string;
}

export function MethodNote({ scope = "each state", className }: MethodNoteProps) {
  return (
    <p className={className ?? "mt-3 text-sm leading-relaxed text-slate-600"}>
      Figures here are estimates modeled from published national fee guides and rate surveys. They are
      shown as ranges and are not quotes from firms in {scope}.
    </p>
  );
}
