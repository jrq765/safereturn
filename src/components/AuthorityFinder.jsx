import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, CheckCircle, MapPin, Navigation, Phone, Mail } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function RecenterMap({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function AuthorityFinder({ parkName, onAuthoritiesChange, selectedAuthorities }) {
  const [searchQuery, setSearchQuery] = useState(parkName || "");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [mapCenter, setMapCenter] = useState([39.5, -98.35]);
  const [mapZoom, setMapZoom] = useState(4);
  const [searched, setSearched] = useState(false);

  const runSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Find the main law enforcement and emergency services agencies near or responsible for: "${query}".
Include: county sheriff office, local police department, state police/highway patrol, fire & rescue, and any known search & rescue teams.
For each agency, provide realistic and accurate contact details based on real agencies in that area.
Return 5-8 agencies sorted by relevance (sheriff/police first).`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          center_lat: { type: "number" },
          center_lng: { type: "number" },
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

    if (result?.agencies?.length > 0) {
      setAgencies(result.agencies);
      if (result.center_lat && result.center_lng) {
        setMapCenter([result.center_lat, result.center_lng]);
        setMapZoom(10);
      }
    } else {
      setAgencies([]);
    }
    setSearched(true);
    setLoading(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `What city, county, and state is at coordinates ${latitude}, ${longitude}? Give a short location name like "Lane County, Oregon" or "Jefferson County, Colorado".`,
        response_json_schema: { type: "object", properties: { location_name: { type: "string" } } }
      });
      const name = res?.location_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setSearchQuery(name);
      setLocating(false);
      runSearch(name);
    }, () => setLocating(false));
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

  const typeColors = {
    "Sheriff": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Police": "bg-blue-100 text-blue-800 border-blue-200",
    "State Police": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Fire & Rescue": "bg-red-100 text-red-800 border-red-200",
    "Search & Rescue": "bg-orange-100 text-orange-800 border-orange-200",
    "Park Rangers": "bg-green-100 text-green-800 border-green-200",
  };

  const getBadgeClass = (type) => {
    for (const [key, val] of Object.entries(typeColors)) {
      if (type?.toLowerCase().includes(key.toLowerCase())) return val;
    }
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">Find Local Authorities</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Search for sheriff offices and emergency services near your destination, then select who to notify.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Enter city, county, park, or address..."
            onKeyDown={e => e.key === "Enter" && runSearch(searchQuery)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Use my location"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        </Button>
        <Button
          type="button"
          onClick={() => runSearch(searchQuery)}
          disabled={loading || !searchQuery.trim()}
          className="bg-primary hover:bg-primary/90 text-white shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Map */}
      {(searched || agencies.length > 0) && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 280 }}>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }}>
            <RecenterMap center={mapCenter} zoom={mapZoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {agencies.map((agency, i) =>
              agency.lat && agency.lng ? (
                <Marker
                  key={i}
                  position={[agency.lat, agency.lng]}
                  icon={isSelected(agency) ? greenIcon : new L.Icon.Default()}
                  eventHandlers={{ click: () => toggleAgency(agency) }}
                >
                  <Popup>
                    <div className="text-sm space-y-1">
                      <strong>{agency.name}</strong>
                      <div className="text-xs text-gray-500">{agency.type}</div>
                      {agency.phone && <div>📞 {agency.phone}</div>}
                      {agency.email && <div>✉️ {agency.email}</div>}
                      <div className="text-xs italic mt-1 text-primary">
                        {isSelected(agency) ? "✓ Selected — click to deselect" : "Click to select"}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      )}

      {/* Agency list */}
      {agencies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {agencies.length} agencies found — click to select for notification
          </p>
          {agencies.map((agency, i) => (
            <div
              key={i}
              onClick={() => toggleAgency(agency)}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected(agency)
                  ? "border-accent bg-accent/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/20"
              }`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected(agency) ? "bg-accent text-white" : "bg-muted"
              }`}>
                {isSelected(agency)
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-medium text-sm text-foreground">{agency.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${getBadgeClass(agency.type)}`}>
                    {agency.type}
                  </span>
                </div>
                {agency.address && <p className="text-xs text-muted-foreground">{agency.address}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  {agency.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {agency.phone}
                    </span>
                  )}
                  {agency.email && (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Mail className="w-3 h-3" /> {agency.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && agencies.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg text-center">
          No agencies found. Try a different location or be more specific.
        </p>
      )}

      {selectedAuthorities.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-sm text-accent font-medium">
          ✓ {selectedAuthorities.length} {selectedAuthorities.length === 1 ? "agency" : "agencies"} selected — they will receive your trip plan by email
        </div>
      )}
    </div>
  );
}