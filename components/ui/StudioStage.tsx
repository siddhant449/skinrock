import imageLoader from "@/lib/imageLoader";

type Props = {
  /** soft light shafts falling from the top corners */
  beams?: boolean;
  /** a dark stone floor in perspective with a lit horizon */
  floor?: boolean;
  /** a soft pool of light at the centre (the stage the object sits on) */
  pool?: boolean;
  /** 0 to 1: how strong the whole studio reads */
  strength?: number;
  className?: string;
};

const FLOOR = imageLoader({ src: "/images/slate-closeup.jpg", width: 1080 });

/**
 * The studio the stone sits in (from the user's reference image): a dark navy room, soft
 * light shafts falling diagonally from the top corners, and a dark stone floor whose horizon
 * catches a thin line of light. Static, palette only, pure DOM and CSS, so phones and tablets
 * get exactly the same space as desktop. Sections use different parts of it so it reads as
 * one room without repeating.
 */
export function StudioStage({ beams = false, floor = false, pool = false, strength = 1, className = "" }: Props) {
  return (
    <div
      aria-hidden
      data-studio=""
      className={`studio pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ ["--studio" as string]: strength }}
    >
      {pool && <div className="studio-pool absolute inset-0" />}
      {beams && (
        <>
          <div data-studio-beam="" className="studio-beam studio-beam-left" />
          <div data-studio-beam="" className="studio-beam studio-beam-right" />
        </>
      )}
      {floor && (
        <div data-studio-floor="" className="studio-floor absolute inset-x-0 bottom-0">
          <div className="studio-floor-mask">
            <div className="studio-floor-plane">
              {/* eslint-disable-next-line @next/next/no-img-element -- a decorative texture, pre-encoded */}
              <img src={FLOOR} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="studio-horizon" />
        </div>
      )}
    </div>
  );
}
