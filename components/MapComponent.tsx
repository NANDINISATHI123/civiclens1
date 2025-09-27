import React, { useEffect, useRef } from 'react';
// FIX: Added .ts extension to fix module resolution error.
import { Report } from '../types.ts';

declare const L: any; // Use Leaflet's global object

interface MapComponentProps {
    reports: (Report & { lat: number; lon: number })[];
    viewReport: (report: Report) => void;
    statusColors: { [key: string]: string };
    userLocation: { lat: number; lon: number } | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ reports, viewReport, statusColors, userLocation }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null); // To hold the map instance
    const markersRef = useRef<any>(null); // To hold the feature group layer

    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined') {
            return;
        }

        // Initialize map only once
        if (!mapRef.current) {
            // Initialize with a default view; it will be adjusted by fitBounds later.
            const map = L.map(mapContainerRef.current).setView([37.7749, -122.4194], 12); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapRef.current = map;
            markersRef.current = L.featureGroup().addTo(map);
        }

        const markers = markersRef.current;
        
        // Clear existing markers
        markers.clearLayers();
        
        // Add user location marker
        if (userLocation) {
             const userIcon = L.divIcon({
                html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
                className: '', // No extra class needed, Tailwind is in the HTML
                iconSize: [16, 16],
            });
            const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon, zIndexOffset: 1000 })
                .bindPopup("Your Location");
            markers.addLayer(userMarker);
        }

        reports.forEach(report => {
            const iconHtml = `<div style="background-color: ${statusColors[report.status]};" class="w-3 h-3 rounded-full ring-2 ring-white"></div>`;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-map-icon',
                iconSize: [12, 12],
            });
            
            // Create the popup content with a button
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
                <div class="text-sm space-y-1">
                    <p class="font-bold">${report.title}</p>
                    <p class="text-xs text-gray-500">Category: ${report.category}</p>
                    <p class="text-xs text-gray-500">Status: ${report.status}</p>
                    <p class="text-xs text-gray-500 font-semibold">${report.vote_count || 0} Confirmation(s)</p>
                </div>
            `;
            const button = document.createElement('button');
            button.innerHTML = 'View Details';
            button.className = 'mt-2 w-full text-xs text-white bg-primary hover:bg-primary/90 rounded-md py-1 px-2';
            button.onclick = () => viewReport(report);
            popupContent.appendChild(button);

            const marker = L.marker([report.lat, report.lon], { icon: customIcon })
                .bindPopup(popupContent);

            markers.addLayer(marker);
        });
        
        // Dynamically adjust map view to fit all markers if any exist
        if (markers.getLayers().length > 0) {
            const bounds = markers.getBounds();
            if (bounds.isValid()) {
                mapRef.current.fitBounds(bounds, { padding: [50, 50] }); // Add padding
            }
        }

    }, [reports, viewReport, statusColors, userLocation]);

    return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default MapComponent;