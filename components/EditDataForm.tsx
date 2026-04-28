import React from 'react';
import { InsuranceData, CoverageItem, ExtraCoverage, Vehicle, VehicleCoverage } from '../types';
import { ChevronDown, ChevronUp, Plus, Trash2, Download, Save, RefreshCw, ArrowLeft, Car, Image } from 'lucide-react';

interface Props {
  data: InsuranceData;
  onUpdate: (newData: InsuranceData) => void;
  onDownload: () => void;
  onBack: () => void;
}

const SectionHeader = ({ title, icon, isOpen, toggle }: { title: string, icon: React.ReactNode, isOpen: boolean, toggle: () => void }) => (
  <div 
    onClick={toggle}
    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-2"
  >
    <div className="flex items-center gap-2 font-semibold text-gray-700">
      {icon}
      <span>{title}</span>
    </div>
    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  </div>
);

const InputGroup = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, placeholder?: string }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

export const EditDataForm: React.FC<Props> = ({ data, onUpdate, onDownload, onBack }) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    'hero': true,
    'customer': true,
    'vehicles': true,
    'premium': true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onUpdate(newData);
  };

  const updateCoverage = (index: number, field: keyof CoverageItem, value: any) => {
    const newCoverages = [...data.coverages];
    newCoverages[index] = { ...newCoverages[index], [field]: value };
    updateField(['coverages'], newCoverages);
  };

  const updateExtra = (index: number, field: keyof ExtraCoverage, value: any) => {
    const newExtras = [...data.extras];
    newExtras[index] = { ...newExtras[index], [field]: value };
    updateField(['extras'], newExtras);
  };

  // Helper for nested vehicle updates
  const updateVehicle = (vIndex: number, field: keyof Vehicle, value: any) => {
    const newVehicles = [...(data.vehicles || [])];
    newVehicles[vIndex] = { ...newVehicles[vIndex], [field]: value };
    updateField(['vehicles'], newVehicles);
  };

  const updateVehicleCoverage = (vIndex: number, cIndex: number, field: keyof VehicleCoverage, value: any) => {
    const newVehicles = [...(data.vehicles || [])];
    if (!newVehicles[vIndex].coverages) newVehicles[vIndex].coverages = [];
    newVehicles[vIndex].coverages![cIndex] = { ...newVehicles[vIndex].coverages![cIndex], [field]: value };
    updateField(['vehicles'], newVehicles);
  };
  
  const addVehicleCoverage = (vIndex: number) => {
     const newVehicles = [...(data.vehicles || [])];
     if (!newVehicles[vIndex].coverages) newVehicles[vIndex].coverages = [];
     newVehicles[vIndex].coverages?.push({ name: 'New Coverage', premium: '$0', icon: '🔹' });
     updateField(['vehicles'], newVehicles);
  };

  const removeVehicleCoverage = (vIndex: number, cIndex: number) => {
    const newVehicles = [...(data.vehicles || [])];
    newVehicles[vIndex].coverages?.splice(cIndex, 1);
    updateField(['vehicles'], newVehicles);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col max-h-[calc(100vh-120px)]">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800">
          <ArrowLeft size={14} /> Start Over
        </button>
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 shadow-sm"
        >
          <Download size={16} /> Download
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md mb-4 border border-blue-100 flex items-start gap-2">
            <RefreshCw size={16} className="mt-0.5 flex-shrink-0" />
            <p>Edits update the preview automatically. Review the parsed data below before downloading.</p>
        </div>

        {/* 1. HERO PHOTO (Specific to Home-Hero) */}
        {data.type === 'home-hero' && (
           <div className="mb-4 bg-purple-50 rounded-lg border border-purple-100 p-1">
             <SectionHeader 
                title="Hero Image" 
                icon={<Image size={16} className="text-purple-600" />} 
                isOpen={openSections['hero']} 
                toggle={() => toggleSection('hero')} 
              />
              {openSections['hero'] && (
                 <div className="p-2">
                    <InputGroup label="Home Photo URL (Imgur link)" value={data.homePhotoUrl || ''} onChange={(e) => updateField(['homePhotoUrl'], e.target.value)} placeholder="https://i.imgur.com/..." />
                    <div className="text-[10px] text-gray-500 mt-[-8px] mb-2">Paste a direct link to the property photo.</div>
                 </div>
              )}
           </div>
        )}

        {/* 1. Customer & Policy */}
        <div>
          <SectionHeader 
            title="Customer & Policy" 
            icon={<span className="text-lg">👤</span>} 
            isOpen={openSections['customer']} 
            toggle={() => toggleSection('customer')} 
          />
          {openSections['customer'] && (
            <div className="pl-2 pr-1 space-y-3">
              <InputGroup label="Client Name" value={data.customer.name} onChange={(e) => updateField(['customer', 'name'], e.target.value)} />
              <InputGroup label="Address" value={data.customer.address} onChange={(e) => updateField(['customer', 'address'], e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Policy Period" value={data.customer.policyPeriod} onChange={(e) => updateField(['customer', 'policyPeriod'], e.target.value)} />
                <InputGroup label="Quote Date" value={data.customer.quoteDate} onChange={(e) => updateField(['customer', 'quoteDate'], e.target.value)} />
              </div>
              <InputGroup label="Carrier Name" value={data.carrier.name} onChange={(e) => updateField(['carrier', 'name'], e.target.value)} />
              <InputGroup label="Carrier Subtext" value={data.carrier.subText} onChange={(e) => updateField(['carrier', 'subText'], e.target.value)} />
            </div>
          )}
        </div>

        {/* 2a. Property Details (Home) */}
        {(data.type === 'home' || data.type === 'home-hero') && data.property && (
          <div>
            <SectionHeader 
              title="Property Details" 
              icon={<span className="text-lg">🏠</span>} 
              isOpen={openSections['property']} 
              toggle={() => toggleSection('property')} 
            />
            {openSections['property'] && (
              <div className="pl-2 pr-1 grid grid-cols-2 gap-3">
                <InputGroup label="Type" value={data.property.type} onChange={(e) => updateField(['property', 'type'], e.target.value)} />
                <InputGroup label="Year Built" value={data.property.built} onChange={(e) => updateField(['property', 'built'], e.target.value)} />
                <InputGroup label="Construction" value={data.property.construction} onChange={(e) => updateField(['property', 'construction'], e.target.value)} />
                <InputGroup label="Acreage" value={data.property.acreage} onChange={(e) => updateField(['property', 'acreage'], e.target.value)} />
                <InputGroup label="Fire Prot." value={data.property.fireProtection} onChange={(e) => updateField(['property', 'fireProtection'], e.target.value)} />
                <InputGroup label="Occupancy" value={data.property.occupancy} onChange={(e) => updateField(['property', 'occupancy'], e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* 2b. Vehicle Details (Auto) */}
        {data.type === 'auto' && data.vehicles && (
           <div>
            <SectionHeader 
              title={`Vehicles (${data.vehicles.length})`} 
              icon={<span className="text-lg">🚘</span>} 
              isOpen={openSections['vehicles']} 
              toggle={() => toggleSection('vehicles')} 
            />
            {openSections['vehicles'] && (
              <div className="space-y-4 pl-1">
                {data.vehicles.map((vehicle, vIdx) => (
                  <div key={vIdx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                      <div className="font-bold text-sm text-gray-700">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                      <span className="text-xs text-gray-500">{vehicle.annualPremium}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                       <InputGroup label="Year" value={vehicle.year} onChange={(e) => updateVehicle(vIdx, 'year', e.target.value)} />
                       <InputGroup label="Make" value={vehicle.make} onChange={(e) => updateVehicle(vIdx, 'make', e.target.value)} />
                       <InputGroup label="Model" value={vehicle.model} onChange={(e) => updateVehicle(vIdx, 'model', e.target.value)} />
                       <InputGroup label="VIN" value={vehicle.vin} onChange={(e) => updateVehicle(vIdx, 'vin', e.target.value)} />
                       <div className="col-span-2">
                         <InputGroup label="Annual Premium" value={vehicle.annualPremium || ''} onChange={(e) => updateVehicle(vIdx, 'annualPremium', e.target.value)} />
                       </div>
                    </div>

                    <div className="mt-2">
                       <div className="flex justify-between items-center mb-1">
                         <label className="text-xs font-semibold text-gray-600">Specific Coverages (e.g. Towing)</label>
                         <button onClick={() => addVehicleCoverage(vIdx)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Plus size={12}/> Add</button>
                       </div>
                       <div className="space-y-2">
                         {vehicle.coverages?.map((vc, cIdx) => (
                           <div key={cIdx} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-200">
                              <input className="w-8 text-center text-sm border-b" value={vc.icon} onChange={(e) => updateVehicleCoverage(vIdx, cIdx, 'icon', e.target.value)} placeholder="Icon" />
                              <div className="flex-1">
                                <input className="w-full text-xs font-medium border-none p-0 focus:ring-0" value={vc.name} onChange={(e) => updateVehicleCoverage(vIdx, cIdx, 'name', e.target.value)} placeholder="Name (e.g. Towing)" />
                                <input className="w-full text-[10px] text-gray-500 border-none p-0 focus:ring-0" value={vc.deductible || ''} onChange={(e) => updateVehicleCoverage(vIdx, cIdx, 'deductible', e.target.value)} placeholder="Deductible/Limit" />
                              </div>
                              <input className="w-16 text-right text-xs font-bold border-none p-0 focus:ring-0" value={vc.premium || ''} onChange={(e) => updateVehicleCoverage(vIdx, cIdx, 'premium', e.target.value)} placeholder="Cost" />
                              <button onClick={() => removeVehicleCoverage(vIdx, cIdx)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
           </div>
        )}

        {/* 3. Premium & Deductible */}
        <div>
           <SectionHeader 
            title="Premium & Financials" 
            icon={<span className="text-lg">💰</span>} 
            isOpen={openSections['premium']} 
            toggle={() => toggleSection('premium')} 
          />
          {openSections['premium'] && (
            <div className="pl-2 pr-1 space-y-3">
               <div className="grid grid-cols-2 gap-2">
                  <InputGroup label="Base Premium" value={data.premium.base} onChange={(e) => updateField(['premium', 'base'], e.target.value)} />
                  <InputGroup label="Extras Cost" value={data.premium.extrasCost} onChange={(e) => updateField(['premium', 'extrasCost'], e.target.value)} />
                  <InputGroup label="Discounts Amt" value={data.premium.discountsAmount} onChange={(e) => updateField(['premium', 'discountsAmount'], e.target.value)} />
                  <InputGroup label="Total Annual" value={data.premium.totalAnnual} onChange={(e) => updateField(['premium', 'totalAnnual'], e.target.value)} />
               </div>
               <InputGroup label="Monthly Estimate" value={data.premium.monthlyEstimate} onChange={(e) => updateField(['premium', 'monthlyEstimate'], e.target.value)} />
               <div className="pt-2 border-t border-gray-100">
                  <InputGroup label="Deductible Amount" value={data.deductible.amount} onChange={(e) => updateField(['deductible', 'amount'], e.target.value)} />
                  <InputGroup label="Deductible Desc" value={data.deductible.description} onChange={(e) => updateField(['deductible', 'description'], e.target.value)} />
               </div>
            </div>
          )}
        </div>

        {/* 4. Agent Info */}
        <div>
           <SectionHeader 
            title="Agent Branding" 
            icon={<span className="text-lg">🕴️</span>} 
            isOpen={openSections['agent']} 
            toggle={() => toggleSection('agent')} 
          />
          {openSections['agent'] && (
            <div className="pl-2 pr-1 space-y-3">
                <InputGroup label="Agency Name" value={data.agent.name} onChange={(e) => updateField(['agent', 'name'], e.target.value)} />
                <InputGroup label="Phone" value={data.agent.phone} onChange={(e) => updateField(['agent', 'phone'], e.target.value)} />
                <InputGroup label="Email" value={data.agent.email} onChange={(e) => updateField(['agent', 'email'], e.target.value)} />
                <InputGroup label="Website" value={data.agent.website} onChange={(e) => updateField(['agent', 'website'], e.target.value)} />
                <InputGroup label="Logo URL" value={data.agent.logoUrl || ''} onChange={(e) => updateField(['agent', 'logoUrl'], e.target.value)} placeholder="https://..." />
            </div>
          )}
        </div>
        
        {/* 5. Coverages List (Policy Wide) */}
        <div>
           <SectionHeader 
            title={`Policy Coverages (${data.coverages.length})`} 
            icon={<span className="text-lg">🛡️</span>} 
            isOpen={openSections['coverages']} 
            toggle={() => toggleSection('coverages')} 
          />
          {openSections['coverages'] && (
            <div className="pl-2 pr-1 space-y-4">
              {data.coverages.map((cov, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-3 bg-gray-50 relative">
                   <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Title</label>
                        <input className="w-full text-sm border rounded p-1" value={cov.title} onChange={(e) => updateCoverage(idx, 'title', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Amount</label>
                        <input className="w-full text-sm border rounded p-1 font-bold" value={cov.amount} onChange={(e) => updateCoverage(idx, 'amount', e.target.value)} />
                      </div>
                   </div>
                   <div className="mb-2">
                      <label className="text-xs text-gray-500">Explanation</label>
                      <textarea className="w-full text-xs border rounded p-1 h-12" value={cov.explanation} onChange={(e) => updateCoverage(idx, 'explanation', e.target.value)} />
                   </div>
                   <div>
                      <label className="text-xs text-gray-500">Example</label>
                      <textarea className="w-full text-xs border rounded p-1 h-12 bg-gray-100" value={cov.example} onChange={(e) => updateCoverage(idx, 'example', e.target.value)} />
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

         {/* 6. Extras List (Home Only usually) */}
         {data.type !== 'auto' && (
           <div>
             <SectionHeader 
              title={`Extras (${data.extras.length})`} 
              icon={<span className="text-lg">➕</span>} 
              isOpen={openSections['extras']} 
              toggle={() => toggleSection('extras')} 
            />
            {openSections['extras'] && (
              <div className="pl-2 pr-1 space-y-4">
                {data.extras.map((ext, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3 bg-gray-50">
                     <div className="flex justify-between mb-1">
                        <input className="font-bold text-sm bg-transparent border-b border-gray-300 w-2/3" value={ext.name} onChange={(e) => updateExtra(idx, 'name', e.target.value)} />
                        <input className="text-right text-sm bg-transparent border-b border-gray-300 w-1/4" value={ext.cost} onChange={(e) => updateExtra(idx, 'cost', e.target.value)} />
                     </div>
                     <textarea className="w-full text-xs border rounded p-1 h-10 mt-1" value={ext.description} onChange={(e) => updateExtra(idx, 'description', e.target.value)} />
                  </div>
                ))}
              </div>
            )}
           </div>
         )}

         {/* 7. Not Covered */}
         <div>
          <SectionHeader 
            title="Not Covered Text" 
            icon={<span className="text-lg">⚠️</span>} 
            isOpen={openSections['notCovered']} 
            toggle={() => toggleSection('notCovered')} 
          />
          {openSections['notCovered'] && (
             <div className="pl-2 pr-1">
               <textarea 
                  className="w-full text-sm border border-gray-300 rounded p-2 h-24" 
                  value={data.notCovered} 
                  onChange={(e) => updateField(['notCovered'], e.target.value)} 
                />
             </div>
          )}
        </div>

      </div>
    </div>
  );
};