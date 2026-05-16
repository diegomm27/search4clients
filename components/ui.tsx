import clsx from "clsx";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={clsx(
        "focus-ring inline-flex items-center justify-center rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink",
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-lg border border-line bg-white p-5 shadow-sm", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="focus-ring min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm" {...props} />;
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" }) {
  return (
    <span
      className={clsx("inline-flex rounded px-2 py-1 text-xs font-medium", {
        "bg-paper text-moss": tone === "default",
        "bg-green-100 text-green-800": tone === "good",
        "bg-amber-100 text-amber-800": tone === "warn"
      })}
    >
      {children}
    </span>
  );
}
