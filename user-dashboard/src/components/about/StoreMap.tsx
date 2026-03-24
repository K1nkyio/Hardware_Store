interface Store {
  name: string;
  address: string;
  phone: string;
  hours: string;
}

const stores: Store[] = [
  {
    name: "Raph Supply Quezon City Hub",
    address: "123 Hardware Avenue, Quezon City, Metro Manila",
    phone: "+63 (2) 8555-0123",
    hours: "Mon-Sat: 8AM-6PM",
  },
  {
    name: "Raph Supply Makati Trade Counter",
    address: "48 Chino Roces Avenue, Makati City, Metro Manila",
    phone: "+63 (2) 8555-0175",
    hours: "Mon-Sat: 8AM-6PM",
  },
  {
    name: "Raph Supply Pasig Fulfillment Point",
    address: "205 C. Raymundo Avenue, Pasig City, Metro Manila",
    phone: "+63 (2) 8555-0198",
    hours: "Mon-Sat: 8AM-6PM",
  },
];

const StoreMap = () => {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border border-border bg-muted/10">
      <iframe
        title="Store locations map"
        src="https://www.google.com/maps?q=14.5995,120.9842&z=11&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full"
      />

      <div className="absolute left-4 top-4 max-w-xs rounded-lg bg-background/90 p-4 backdrop-blur-sm">
        <h4 className="mb-3 text-sm font-medium text-foreground">Metro Manila Locations</h4>
        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.name} className="text-xs">
              <div className="mb-1 flex items-center gap-2">
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                <span className="font-medium text-foreground">{store.name}</span>
              </div>
              <p className="ml-4 text-muted-foreground">{store.address}</p>
              <p className="ml-4 text-muted-foreground">{store.phone}</p>
              <p className="ml-4 text-muted-foreground">{store.hours}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
