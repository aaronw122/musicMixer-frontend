import { forwardRef, useImperativeHandle, useRef } from 'react';

export type PaintMeldRefs = {
  displacement: SVGFEDisplacementMapElement | null;
  blur: SVGFEGaussianBlurElement | null;
  colorMatrix: SVGFEColorMatrixElement | null;
};

type Props = {
  filterId?: string;
};

/**
 * SVG filter definition for the paint-meld effect.
 * Renders <defs> — must be placed inside an <svg> element.
 *
 * Filter chain:
 * 1. feTurbulence — Perlin noise field for organic displacement
 * 2. feDisplacementMap — pushes pixels using noise (painterly edges / tendrils)
 * 3. feGaussianBlur — gooey metaball merge
 * 4. feColorMatrix — alpha contrast snap (makes blur → crisp blob boundary)
 *
 * Dynamic params (displacement scale, blur stdDeviation, colorMatrix values)
 * are updated imperatively via refs + setAttribute() since SVG filter
 * attributes can't be CSS-transitioned.
 */
export const PaintMeldFilter = forwardRef<PaintMeldRefs, Props>(
  function PaintMeldFilter({ filterId = 'paint-meld' }, ref) {
    const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
    const blurRef = useRef<SVGFEGaussianBlurElement>(null);
    const colorMatrixRef = useRef<SVGFEColorMatrixElement>(null);

    useImperativeHandle(ref, () => ({
      get displacement() {
        return displacementRef.current;
      },
      get blur() {
        return blurRef.current;
      },
      get colorMatrix() {
        return colorMatrixRef.current;
      },
    }));

    return (
      <defs>
        <filter
          id={filterId}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.04}
            numOctaves={3}
            seed={42}
            result="noise"
          />
          <feDisplacementMap
            ref={displacementRef}
            in="SourceGraphic"
            in2="noise"
            scale={0}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur
            ref={blurRef}
            in="displaced"
            stdDeviation={0}
            result="blurred"
          />
          <feColorMatrix
            ref={colorMatrixRef}
            in="blurred"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="gooey"
          />
        </filter>
      </defs>
    );
  },
);
