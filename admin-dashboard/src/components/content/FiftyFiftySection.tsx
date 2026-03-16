import { Link } from "react-router-dom";

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Link to="/category/pipes-fittings" className="block">
            <div className="w-full aspect-square mb-3 overflow-hidden bg-muted flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🔧</div>
                <p className="text-sm font-light text-muted-foreground">Pipes & Fittings</p>
              </div>
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">Pipes & Fittings</h3>
            <p className="text-sm font-light text-foreground">PVC, GI, and copper pipes with all the fittings you need</p>
          </div>
        </div>

        <div>
          <Link to="/category/faucets-taps" className="block">
            <div className="w-full aspect-square mb-3 overflow-hidden bg-muted flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🚿</div>
                <p className="text-sm font-light text-muted-foreground">Faucets & Taps</p>
              </div>
            </div>
          </Link>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">Faucets & Taps</h3>
            <p className="text-sm font-light text-foreground">Kitchen and bathroom faucets from trusted brands</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiftyFiftySection;
