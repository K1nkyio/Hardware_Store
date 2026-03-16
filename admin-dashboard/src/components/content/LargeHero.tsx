const LargeHero = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="w-full aspect-[16/9] mb-3 overflow-hidden bg-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-3xl md:text-5xl font-light text-background mb-4">Quality Plumbing Supplies</h1>
          <p className="text-sm md:text-base font-light text-background/80 max-w-lg mx-auto">
            From residential repairs to commercial projects — everything you need under one roof.
          </p>
        </div>
      </div>
      <div>
        <h2 className="text-sm font-normal text-foreground mb-1">Raph Plumbing Supply</h2>
        <p className="text-sm font-light text-foreground">Serving contractors and homeowners since 2010</p>
      </div>
    </section>
  );
};

export default LargeHero;
