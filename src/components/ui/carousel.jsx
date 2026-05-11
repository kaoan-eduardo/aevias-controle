import * as React from "react"
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ─── Context ────────────────────────────────────────────────────────────────

const CarouselContext = React.createContext(null)

export function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

// ─── Internal hook (SRP: scroll state isolated) ─────────────────────────────

function useCarouselScrollState(api) {
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!api) return

    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api.off("reInit", onSelect)
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  return { canScrollPrev, canScrollNext }
}

// ─── Carousel ───────────────────────────────────────────────────────────────

const Carousel = React.forwardRef((
  { orientation = "horizontal", opts, setApi, plugins, className, children, ...props },
  ref
) => {
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y",
  }, plugins)

  const { canScrollPrev, canScrollNext } = useCarouselScrollState(api)

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

  const handleKeyDown = React.useCallback((event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); scrollPrev() }
    else if (event.key === "ArrowRight") { event.preventDefault(); scrollNext() }
  }, [scrollPrev, scrollNext])

  React.useEffect(() => {
    if (api && setApi) setApi(api)
  }, [api, setApi])

  const resolvedOrientation = orientation || (opts?.axis === "y" ? "vertical" : "horizontal")

  return (
    <CarouselContext.Provider value={{
      carouselRef,
      api,
      opts,
      orientation: resolvedOrientation,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
    }}>
      <section
        ref={ref}
        role="region"
        aria-label="carousel"
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </section>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = "Carousel"

// ─── CarouselContent ─────────────────────────────────────────────────────────

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <ol
        ref={ref}
        className={cn(
          "flex list-none p-0 m-0",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

// ─── CarouselItem ────────────────────────────────────────────────────────────

const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <li
      ref={ref}
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
      />
      )
      })
      CarouselItem.displayName = "CarouselItem"

      // Note: CarouselContent wraps items in an <ol> to pair with <li> CarouselItem

// ─── CarouselNavButton (DRY: shared by Previous & Next) ──────────────────────

const NAV_VARIANTS = {
  previous: {
    Icon: ArrowLeft,
    label: "Previous slide",
    horizontal: "-left-12 top-1/2 -translate-y-1/2",
    vertical: "-top-12 left-1/2 -translate-x-1/2 rotate-90",
  },
  next: {
    Icon: ArrowRight,
    label: "Next slide",
    horizontal: "-right-12 top-1/2 -translate-y-1/2",
    vertical: "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
  },
}

const CarouselNavButton = React.forwardRef(
  ({ direction, className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
    const isPrev = direction === "previous"
    const { Icon, label, horizontal, vertical } = NAV_VARIANTS[direction]

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal" ? horizontal : vertical,
          className
        )}
        disabled={isPrev ? !canScrollPrev : !canScrollNext}
        onClick={isPrev ? scrollPrev : scrollNext}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <span className="sr-only">{label}</span>
      </Button>
    )
  }
)
CarouselNavButton.displayName = "CarouselNavButton"

// ─── Public navigation components ────────────────────────────────────────────

const CarouselPrevious = React.forwardRef((props, ref) => (
  <CarouselNavButton ref={ref} direction="previous" {...props} />
))
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef((props, ref) => (
  <CarouselNavButton ref={ref} direction="next" {...props} />
))
CarouselNext.displayName = "CarouselNext"

// ─── Exports ─────────────────────────────────────────────────────────────────

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }