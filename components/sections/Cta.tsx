import { site } from "@/content/site";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Cta() {
  const { cta } = site;
  return (
    <section id="samples" className="relative px-5 py-28 md:px-8 md:py-[20vh]">
      <div className="relative z-20 flex flex-col items-start gap-12 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-8">
          <span className="text-label text-glacier">07 / Samples</span>
          <SplitReveal as="h2" className="text-display max-w-[11ch] text-[clamp(3.5rem,9vw,11rem)]">
            {cta.title}
          </SplitReveal>
          <p className="max-w-[36ch] text-base leading-relaxed text-stone/75 md:text-lg">{cta.body}</p>
        </div>
        <MagneticButton href={cta.href} className="h-40 w-40 shrink-0 text-[15px] font-medium md:h-52 md:w-52">
          {cta.button}
        </MagneticButton>
      </div>
    </section>
  );
}
