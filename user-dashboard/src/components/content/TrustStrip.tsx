const trustItems = [
  {
    title: "Fast Fulfillment",
    description: "Dispatch from stocked inventory with clear delivery timelines.",
  },
  {
    title: "Verified Quality",
    description: "Products sourced from trusted brands and inspected before dispatch.",
  },
  {
    title: "Bulk-Ready Supply",
    description: "Reliable support for repeat orders and project-based quantities.",
  },
  {
    title: "Practical Support",
    description: "Customer care that helps with product matching and replacements.",
  },
];

const TrustStrip = () => {
  return (
    <section className="home-reveal home-delay-1 w-full px-4 sm:px-6 pb-16">
      <div className="mx-auto max-w-[1460px]">
        <div className="border-y border-border bg-muted/30">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item, index) => {
              return (
                <div
                  key={item.title}
                  className="home-card-rise bg-muted/30 p-6 sm:p-5"
                  style={{ animationDelay: `${120 + index * 70}ms` }}
                >
                  <div>
                    <p className="text-base font-normal text-foreground sm:text-sm">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-xs">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
