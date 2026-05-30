import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const selectedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AuthorityFinder({ parkName, onAuthoritiesChange, selectedAuthorities }) {
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [mapCenter, setMapCenter] = useState([39.5, -98.35]);
  const [searched, setSearched] = useState(false);

  const findAuthorities = async () => {
    if (!parkName) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find the main law enforcement and search & rescue agencies near or responsible for: "${parkName}".
Include: county sheriff office, state police/highway patrol, national park service rangers, and any known search & rescue teams.
For each agency provide realistic contact information. Return 4-6 agencies.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          park_lat: { type: "number" },
          park_lng: { type: "number" },
          agencies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                address: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
              }
            }
          }
        }
      }
    });

    if (result.agencies?.length > 0) {
      setAgencies(result.agencies);
      if (result.park_lat && result.park_lng) {
        setMapCenter([result.park_lat, result.park_lng]);
      }
    }
    setSearched(true);
    setLoading(false);
  };

  const toggleAgency = (agency) => {
    const isSelected = selectedAuthorities.some(a => a.name === agency.name);
    if (isSelected) {
      onAuthoritiesChange(selectedAuthorities.filter(a => a.name !== agency.name));
    } else {
      onAuthoritiesChange([...selectedAuthorities, agency]);
    }
  };

  const isSelected = (agency) => selectedAuthorities.some(a => a.name === agency.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Local Authorities</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Find sheriff offices and search {"&"} rescue teams near your destination
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={findAuthorities}
          disabled={loading || !parkName}
          className="shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
          {loading ? "Searching..." : "Find Agencies"}
        </Button>
      </div>

      {!parkName && (
        <p className="text-xs text-muted-foreground italic bg-muted/50 rounded-lg p-3">
          Enter a destination in Step 2 (Where) to enable authority lookup.
        </p>
      )}

      {searched && agencies.length > 0 && (
        <>
          <div className="rounded-xl overflow-hidden border border-border h-64">
            <MapContainer center={mapCenter} zoom={9} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {agencies.map((agency, i) => (
                agency.lat && agency.lng ? (
                  <Marker
                    key={i}
                    position={[agency.lat, agency.lng]}
                    icon={isSelected(agency) ? selectedIcon : new L.Icon.Default()}
                    eventHandlers={{ click: () => toggleAgency(agency) }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{agency.name}</strong><br />
                        {agency.type}<br />
                        {agency.phone && <span>📞 {agency.phone}<br /></span>}
                        {agency.email && <span>✉️ {agency.email}</span>}
                        <br /><em>{isSelected(agency) ? "✓ Selected" : "Click to select"}</em>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          </div>

          <div className="space-y-2">
            {agencies.map((agency, i) => (
              <div
                key={i}
                onClick={() => toggleAgency(agency)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected(agency)
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected(agency) ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
                  {isSelected(agency) ? <CheckCircle className="w-3 h-3" /> : <MapPin className="w-3 h-3 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{agency.name}</span>
                    <Badge variant="outline" className="text-xs">{agency.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{agency.address}</p>
                  {agency.email && <p className="text-xs text-primary mt-0.5">{agency.email}</p>}
                  {agency.phone && <p className="text-xs text-muted-foreground">{agency.phone}</p>}
                </div>
              </div>
            ))}
          </div>

          {selectedAuthorities.length > 0 && (
            <p className="text-xs text-accent font-medium">
              ✓ {selectedAuthorities.length} {selectedAuthorities.length === 1 ? "agency" : "agencies"} selected — you'll get email links for each
            </p>
          )}
        </>
      )}

      {searched && agencies.length === 0 && (
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          No agencies found. Try a more specific destination name.
        </p>
      )}
    </div>
  );
}