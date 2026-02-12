import { useEffect, useRef, useState } from 'react';

interface Props {
    target: number;
    prefix?: string;
    suffix?: string;
    label: string;
    duration?: number;
}

export default function Counter({ target, prefix = '', suffix = '', label, duration = 2 }: Props) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasSetup = useRef(false);

    useEffect(() => {
        if (!ref.current || hasSetup.current) return;
        hasSetup.current = true;

        // Dynamically import GSAP to avoid SSR issues
        import('gsap').then((gsapModule) => {
            import('gsap/ScrollTrigger').then((stModule) => {
                const gsap = gsapModule.default;
                const ScrollTrigger = stModule.ScrollTrigger;
                gsap.registerPlugin(ScrollTrigger);

                // Find the parent #stats section for the trigger
                const section = ref.current?.closest('#stats');
                if (!section) return;

                // Animate a proxy object and update React state
                const proxy = { val: 0 };

                gsap.to(proxy, {
                    val: target,
                    duration: duration,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',   // Start counting when section top hits 80% of viewport
                        end: 'center center', // Finish counting when section center hits viewport center
                        scrub: 0.5,          // Smooth scrubbing
                    },
                    onUpdate: () => {
                        setCount(Math.round(proxy.val));
                    },
                });
            });
        });
    }, [target, duration]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-gold mb-2 tabular-nums">
                {prefix}{count.toLocaleString()}{suffix}
            </div>
            <div className="text-ivory-muted uppercase tracking-widest text-sm font-body">
                {label}
            </div>
        </div>
    );
}
