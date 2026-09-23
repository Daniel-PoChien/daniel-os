// One consistent 24px outline family, with an active-state detail for every app.
export function appSymbol(id,active=false){
 const shapes={
 welcome:'<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3z"/>',
 luxury:'<path d="M3 21V9l9-6 9 6v12M2 21h20M8 21v-6h8v6M7 10h2m6 0h2M7 13h2m6 0h2"/>',
 hardware:'<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="6" width="8" height="8" rx="1"/><path d="M8 18h2m4 0h2M2 8h2m-2 5h2m16-5h2m-2 5h2"/>',
 files:active?'<path d="M3 8V5h6l2 3h10v3M2 11h21l-4 10H4z"/>':'<path d="M3 6h6l2 3h10v12H3z"/>',
 notes:'<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5"/>',
 terminal:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 4 3-4 3m7 1h5"/>',
 focus:'<circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m6 1 2-2M12 14V9"/>',
 settings:'<path d="M4 3v18M12 3v18M20 3v18"/><rect x="1" y="7" width="6" height="4" rx="1"/><rect x="9" y="14" width="6" height="4" rx="1"/><rect x="17" y="6" width="6" height="4" rx="1"/>',
 about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7" r=".8" fill="currentColor" stroke="none"/>'
 };
 const activeDetails={welcome:'<path d="m8 10 3 3 5-5"/>',luxury:'<path d="M10 6h4v4h-4z" fill="currentColor"/>',hardware:'<circle cx="12" cy="10" r="2" fill="currentColor"/>',files:'',notes:'<path d="m13 19 7-7 2 2-7 7-3 1z" fill="var(--tile)"/>',terminal:'<path d="M14 13h3v3h-3z" fill="currentColor"/>',focus:'<path d="m12 14 4 2"/><circle cx="12" cy="14" r="1.4" fill="currentColor"/>',settings:'<path d="M12 14v4" stroke-width="4"/>',about:'<circle cx="12" cy="12" r="11" stroke-width="1"/>'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${shapes[id]||shapes.welcome}${active?activeDetails[id]||'':''}</svg>`;
}
