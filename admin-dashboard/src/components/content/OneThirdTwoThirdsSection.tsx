import { Link } from "react-router-dom";

const OneThirdTwoThirdsSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Link to="/category/valves" className="block">
            <div className="w-full h-[500px] lg:h-[800px] mb-3 overflow-hidden bg-muted flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">⚙️</div>
                <p className="text-sm font-light text-muted-foreground">Valves & Controls</p>
              </div>
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">Valves & Controls</h3>
            <p className="text-sm font-light text-foreground">Gate, ball, and check valves for every application</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Link to="/category/bathroom" className="block">
            <div className="w-full h-[500px] lg:h-[800px] mb-3 overflow-hidden bg-muted flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🚽</div>
                <p className="text-sm font-light text-muted-foreground">Bathroom Fixtures</p>
              </div>
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">Bathroom Fixtures</h3>
            <p className="text-sm font-light text-foreground">Complete bathroom solutions from toilet sets to shower systems</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;
