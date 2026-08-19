import { cn } from '@/lib/utils';

/** Cream-paper card. `tilt` gives it the scrapbook angle that straightens on
 *  hover; skip it for anything dense or text-heavy. */
export function Card({
  className,
  tilt,
  children,
  ...props
}: React.ComponentProps<'div'> & { tilt?: 'tilt-1' | 'tilt-2' | 'tilt-3' }) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border-2 border-line bg-paper shadow-[0_0.75rem_2rem_-0.75rem_#4a373026]',
        tilt,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-6', className)} {...props} />;
}
