'use client';

import React from 'react';
import { 
  Building2,
  Users,
  UserCheck,
  MapPin,
  CreditCard,
  FileText,
  UserPlus,
  Plus,
  Minus,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Shareholder {
  name: string;
  nationality: string;
  idType: string;
  idNumber: string;
  percentage: number;
  contribution: number;
}

interface BasicInfo {
  companyName: string;
  entityType: string;
  businessActivity: string;
  industry: string;
  priority: string;
}

interface ShareholderData {
  shareCapital: number;
  paidCapital: number;
  sharesPerSol: number;
  shareholders: Shareholder[];
}

interface Management {
  hasBoard: boolean;
  manager: {
    name: string;
    nationality: string;
    idType: string;
    idNumber: string;
  };
  legalRepresentative: {
    name: string;
    nationality: string;
    idType: string;
    idNumber: string;
  };
}

interface Address {
  legalAddress: string;
  district: string;
  province: string;
  department: string;
  postalCode: string;
  businessPremises: string;
  phone: string;
  email: string;
}

interface Banking {
  bankName: string;
  accountType: string;
  initialDeposit: number;
  hasAccountantPlan: boolean;
  accountant: {
    name: string;
    cip: string;
    phone: string;
  };
}

interface Legal {
  notaryOffice: string;
  registryOffice: string;
  sunatOffice: string;
  powerOfAttorney: boolean;
  municipalLicense: boolean;
}

interface Assignment {
  office: string;
  assignedTo: string;
  urgency: string;
  estimatedCompletion: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
    preferredContact: string;
  };
}

interface IncorporationData {
  basicInfo: BasicInfo;
  shareholders: ShareholderData;
  management: Management;
  address: Address;
  banking: Banking;
  legal: Legal;
  assignment: Assignment;
}

interface NewIncorporationModalProps {
  showModal: boolean;
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
  incorporationData: IncorporationData;
  updateIncorporationData: (section: string, data: Partial<IncorporationData[keyof IncorporationData]>) => void;
  addShareholder: () => void;
  removeShareholder: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  onSubmit: () => void;
}

const NewIncorporationModal: React.FC<NewIncorporationModalProps> = ({
  showModal,
  onClose,
  currentStep,
  totalSteps,
  incorporationData,
  updateIncorporationData,
  addShareholder,
  removeShareholder,
  nextStep,
  prevStep,
  onSubmit
}) => {
  if (!showModal) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Building2 className="h-6 w-6 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Basic Company Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={incorporationData.basicInfo.companyName}
                  onChange={(e) => updateIncorporationData('basicInfo', { companyName: e.target.value })}
                  placeholder="Enter the company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Will be checked for availability in SUNARP</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type *</label>
                <select
                  value={incorporationData.basicInfo.entityType}
                  onChange={(e) => updateIncorporationData('basicInfo', { entityType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="S.A.C.">S.A.C. (Sociedad Anónima Cerrada)</option>
                  <option value="S.A.">S.A. (Sociedad Anónima)</option>
                  <option value="E.I.R.L.">E.I.R.L. (Empresa Individual de Responsabilidad Limitada)</option>
                  <option value="S.R.L.">S.R.L. (Sociedad de Responsabilidad Limitada)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Activity *</label>
                <textarea
                  value={incorporationData.basicInfo.businessActivity}
                  onChange={(e) => updateIncorporationData('basicInfo', { businessActivity: e.target.value })}
                  placeholder="Describe the main business activities"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry Sector *</label>
                <select
                  value={incorporationData.basicInfo.industry}
                  onChange={(e) => updateIncorporationData('basicInfo', { industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology & Software</option>
                  <option value="Import/Export">Import/Export</option>
                  <option value="Consulting">Consulting Services</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Retail">Retail & Commerce</option>
                  <option value="Construction">Construction</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                <select
                  value={incorporationData.basicInfo.priority}
                  onChange={(e) => updateIncorporationData('basicInfo', { priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal Processing</option>
                  <option value="express">Express (48-72 hours)</option>
                  <option value="urgent">Urgent (24-48 hours)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-green-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Shareholders & Share Capital</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share Capital (S/) *</label>
                <input
                  type="number"
                  value={incorporationData.shareholders.shareCapital}
                  onChange={(e) => updateIncorporationData('shareholders', { shareCapital: Number(e.target.value) })}
                  placeholder="1000"
                  min="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum S/ 1,000</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid Capital (S/) *</label>
                <input
                  type="number"
                  value={incorporationData.shareholders.paidCapital}
                  onChange={(e) => updateIncorporationData('shareholders', { paidCapital: Number(e.target.value) })}
                  placeholder="250"
                  min="250"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 25% of share capital</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shares per Sol *</label>
                <input
                  type="number"
                  value={incorporationData.shareholders.sharesPerSol}
                  onChange={(e) => updateIncorporationData('shareholders', { sharesPerSol: Number(e.target.value) })}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shares per Sol *</label>
                <input
                  type="number"
                  value={incorporationData.shareholders.sharesPerSol}
                  onChange={(e) => updateIncorporationData('shareholders', { sharesPerSol: Number(e.target.value) })}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Shareholders</h4>
                <button
                  type="button"
                  onClick={addShareholder}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Shareholder</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {incorporationData.shareholders.shareholders.map((shareholder: Shareholder, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Shareholder {index + 1}</h5>
                      {incorporationData.shareholders.shareholders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShareholder(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={shareholder.name}
                          onChange={(e) => {
                            const updatedShareholders = [...incorporationData.shareholders.shareholders];
                            updatedShareholders[index].name = e.target.value;
                            updateIncorporationData('shareholders', { shareholders: updatedShareholders });
                          }}
                          placeholder="Full legal name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                        <select
                          value={shareholder.nationality}
                          onChange={(e) => {
                            const updatedShareholders = [...incorporationData.shareholders.shareholders];
                            updatedShareholders[index].nationality = e.target.value;
                            updateIncorporationData('shareholders', { shareholders: updatedShareholders });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Peruvian">Peruvian</option>
                          <option value="Foreign">Foreign</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                        <select
                          value={shareholder.idType}
                          onChange={(e) => {
                            const updatedShareholders = [...incorporationData.shareholders.shareholders];
                            updatedShareholders[index].idType = e.target.value;
                            updateIncorporationData('shareholders', { shareholders: updatedShareholders });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="DNI">DNI</option>
                          <option value="Passport">Passport</option>
                          <option value="CE">CE</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
                        <input
                          type="text"
                          value={shareholder.idNumber}
                          onChange={(e) => {
                            const updatedShareholders = [...incorporationData.shareholders.shareholders];
                            updatedShareholders[index].idNumber = e.target.value;
                            updateIncorporationData('shareholders', { shareholders: updatedShareholders });
                          }}
                          placeholder="ID number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ownership % *</label>
                        <input
                          type="number"
                          value={shareholder.percentage}
                          onChange={(e) => {
                            const updatedShareholders = [...incorporationData.shareholders.shareholders];
                            updatedShareholders[index].percentage = Number(e.target.value);
                            updateIncorporationData('shareholders', { shareholders: updatedShareholders });
                          }}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capital Contribution (S/) *</label>
                        <input
                          type="number"
                          value={shareholder.contribution}
                          onChange={(e) => {
                            const updatedShareholders = [...incorporationData.shareholders.shareholders];
                            updatedShareholders[index].contribution = Number(e.target.value);
                            updateIncorporationData('shareholders', { shareholders: updatedShareholders });
                          }}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <UserCheck className="h-6 w-6 text-purple-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Company Management Structure</h3>
            </div>
            
            <div className="space-y-6">
              {/* Board of Directors */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={incorporationData.management.hasBoard}
                    onChange={(e) => updateIncorporationData('management', { hasBoard: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Company will have Board of Directors</label>
                </div>
                <p className="text-xs text-gray-500 mb-4">Required for S.A. entities, optional for S.A.C.</p>
              </div>

              {/* Manager Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">General Manager *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={incorporationData.management.manager.name}
                      onChange={(e) => updateIncorporationData('management', { 
                        manager: { ...incorporationData.management.manager, name: e.target.value }
                      })}
                      placeholder="Manager's full legal name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                    <select
                      value={incorporationData.management.manager.nationality}
                      onChange={(e) => updateIncorporationData('management', { 
                        manager: { ...incorporationData.management.manager, nationality: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Peruvian">Peruvian</option>
                      <option value="Foreign">Foreign</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                    <select
                      value={incorporationData.management.manager.idType}
                      onChange={(e) => updateIncorporationData('management', { 
                        manager: { ...incorporationData.management.manager, idType: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DNI">DNI</option>
                      <option value="Passport">Passport</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                    <input
                      type="text"
                      value={incorporationData.management.manager.idNumber}
                      onChange={(e) => updateIncorporationData('management', { 
                        manager: { ...incorporationData.management.manager, idNumber: e.target.value }
                      })}
                      placeholder="ID number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Legal Representative */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Legal Representative *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={incorporationData.management.legalRepresentative.name}
                      onChange={(e) => updateIncorporationData('management', { 
                        legalRepresentative: { ...incorporationData.management.legalRepresentative, name: e.target.value }
                      })}
                      placeholder="Legal representative's full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                    <select
                      value={incorporationData.management.legalRepresentative.nationality}
                      onChange={(e) => updateIncorporationData('management', { 
                        legalRepresentative: { ...incorporationData.management.legalRepresentative, nationality: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Peruvian">Peruvian</option>
                      <option value="Foreign">Foreign</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                    <select
                      value={incorporationData.management.legalRepresentative.idType}
                      onChange={(e) => updateIncorporationData('management', { 
                        legalRepresentative: { ...incorporationData.management.legalRepresentative, idType: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DNI">DNI</option>
                      <option value="Passport">Passport</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
                    <input
                      type="text"
                      value={incorporationData.management.legalRepresentative.idNumber}
                      onChange={(e) => updateIncorporationData('management', { 
                        legalRepresentative: { ...incorporationData.management.legalRepresentative, idNumber: e.target.value }
                      })}
                      placeholder="ID number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <MapPin className="h-6 w-6 text-green-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Company Address & Contact Information</h3>
            </div>
            
            <div className="space-y-6">
              {/* Legal Address */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Legal Address *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                    <input
                      type="text"
                      value={incorporationData.address.legalAddress}
                      onChange={(e) => updateIncorporationData('address', { legalAddress: e.target.value })}
                      placeholder="Av. Larco 1301, Miraflores"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                    <input
                      type="text"
                      value={incorporationData.address.district}
                      onChange={(e) => updateIncorporationData('address', { district: e.target.value })}
                      placeholder="Miraflores"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                    <select
                      value={incorporationData.address.province}
                      onChange={(e) => updateIncorporationData('address', { province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Lima">Lima</option>
                      <option value="Arequipa">Arequipa</option>
                      <option value="Cusco">Cusco</option>
                      <option value="Trujillo">Trujillo</option>
                      <option value="Chiclayo">Chiclayo</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                    <select
                      value={incorporationData.address.department}
                      onChange={(e) => updateIncorporationData('address', { department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Lima">Lima</option>
                      <option value="Arequipa">Arequipa</option>
                      <option value="Cusco">Cusco</option>
                      <option value="La Libertad">La Libertad</option>
                      <option value="Lambayeque">Lambayeque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={incorporationData.address.postalCode}
                      onChange={(e) => updateIncorporationData('address', { postalCode: e.target.value })}
                      placeholder="15074"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Business Premises */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Premises</label>
                <select
                  value={incorporationData.address.businessPremises}
                  onChange={(e) => updateIncorporationData('address', { businessPremises: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rented">Rented</option>
                  <option value="owned">Owned</option>
                  <option value="shared">Shared Office</option>
                </select>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={incorporationData.address.phone}
                      onChange={(e) => updateIncorporationData('address', { phone: e.target.value })}
                      placeholder="+51 999 123 456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={incorporationData.address.email}
                      onChange={(e) => updateIncorporationData('address', { email: e.target.value })}
                      placeholder="contact@company.pe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Banking & Financial Setup</h3>
            </div>
            
            <div className="space-y-6">
              {/* Bank Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Corporate Bank Account *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Bank *</label>
                    <select
                      value={incorporationData.banking.bankName}
                      onChange={(e) => updateIncorporationData('banking', { bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Bank</option>
                      <option value="BCP">Banco de Crédito del Perú (BCP)</option>
                      <option value="BBVA">BBVA</option>
                      <option value="Interbank">Interbank</option>
                      <option value="Scotiabank">Scotiabank Perú</option>
                      <option value="Banco de la Nación">Banco de la Nación</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <select
                      value={incorporationData.banking.accountType}
                      onChange={(e) => updateIncorporationData('banking', { accountType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="current">Current Account</option>
                      <option value="savings">Savings Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Initial Deposit (S/) *</label>
                    <input
                      type="number"
                      value={incorporationData.banking.initialDeposit}
                      onChange={(e) => updateIncorporationData('banking', { initialDeposit: Number(e.target.value) })}
                      placeholder="1000"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum deposit amount varies by bank</p>
                  </div>
                </div>
              </div>

              {/* Accountant Information */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={incorporationData.banking.hasAccountantPlan}
                    onChange={(e) => updateIncorporationData('banking', { hasAccountantPlan: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Assign company accountant</label>
                </div>
                
                {incorporationData.banking.hasAccountantPlan && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Accountant Name</label>
                      <input
                        type="text"
                        value={incorporationData.banking.accountant.name}
                        onChange={(e) => updateIncorporationData('banking', { 
                          accountant: { ...incorporationData.banking.accountant, name: e.target.value }
                        })}
                        placeholder="Full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CIP Number</label>
                      <input
                        type="text"
                        value={incorporationData.banking.accountant.cip}
                        onChange={(e) => updateIncorporationData('banking', { 
                          accountant: { ...incorporationData.banking.accountant, cip: e.target.value }
                        })}
                        placeholder="CIP registration"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={incorporationData.banking.accountant.phone}
                        onChange={(e) => updateIncorporationData('banking', { 
                          accountant: { ...incorporationData.banking.accountant, phone: e.target.value }
                        })}
                        placeholder="+51 999 123 456"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-orange-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Legal Requirements & Documentation</h3>
            </div>
            
            <div className="space-y-6">
              {/* Notary & Registry */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Notary & Registry Offices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Notary Office</label>
                    <input
                      type="text"
                      value={incorporationData.legal.notaryOffice}
                      onChange={(e) => updateIncorporationData('legal', { notaryOffice: e.target.value })}
                      placeholder="Notary office name or location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SUNARP Registry Office *</label>
                    <select
                      value={incorporationData.legal.registryOffice}
                      onChange={(e) => updateIncorporationData('legal', { registryOffice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Lima">Lima</option>
                      <option value="Arequipa">Arequipa</option>
                      <option value="Cusco">Cusco</option>
                      <option value="Trujillo">Trujillo</option>
                      <option value="Chiclayo">Chiclayo</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SUNAT Office</label>
                    <input
                      type="text"
                      value={incorporationData.legal.sunatOffice}
                      onChange={(e) => updateIncorporationData('legal', { sunatOffice: e.target.value })}
                      placeholder="Preferred SUNAT office location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Legal Documentation */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Legal Documentation</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={incorporationData.legal.powerOfAttorney}
                      onChange={(e) => updateIncorporationData('legal', { powerOfAttorney: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Power of Attorney required</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={incorporationData.legal.municipalLicense}
                      onChange={(e) => updateIncorporationData('legal', { municipalLicense: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Municipal operating license required</label>
                  </div>
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Required Documents Checklist</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Articles of Incorporation',
                      'Company Bylaws',
                      'Shareholder Agreements',
                      'Manager Appointment',
                      'Legal Representative Designation',
                      'Capital Contribution Proof',
                      'Bank Account Opening',
                      'SUNAT Registration',
                      'Municipal License Application',
                      'Power of Attorney (if applicable)'
                    ].map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="h-4 w-4 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xs text-blue-600">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <UserPlus className="h-6 w-6 text-green-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Assignment & Timeline</h3>
            </div>
            
            <div className="space-y-6">
              {/* Assignment Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Case Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Office Location *</label>
                    <select
                      value={incorporationData.assignment.office}
                      onChange={(e) => updateIncorporationData('assignment', { office: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Peru">🇵🇪 Peru Office</option>
                      <option value="Mexico">🇲🇽 Mexico Office</option>
                      <option value="Colombia">🇨🇴 Colombia Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Legal Analyst *</label>
                    <select
                      value={incorporationData.assignment.assignedTo}
                      onChange={(e) => updateIncorporationData('assignment', { assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Carlos Mendoza">Carlos Mendoza</option>
                      <option value="Ana Torres">Ana Torres</option>
                      <option value="Luis Rodriguez">Luis Rodriguez</option>
                      <option value="Carmen Flores">Carmen Flores</option>
                      <option value="Miguel Santos">Miguel Santos</option>
                      <option value="Sofia Garcia">Sofia Garcia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Processing Urgency</label>
                    <select
                      value={incorporationData.assignment.urgency}
                      onChange={(e) => updateIncorporationData('assignment', { urgency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal (30-45 days)</option>
                      <option value="express">Express (15-20 days)</option>
                      <option value="urgent">Urgent (10-15 days)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Expected Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Completion Date</label>
                    <input
                      type="date"
                      value={incorporationData.assignment.estimatedCompletion}
                      onChange={(e) => updateIncorporationData('assignment', { estimatedCompletion: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Client Contact */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Client Contact Information *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={incorporationData.assignment.clientContact.name}
                      onChange={(e) => updateIncorporationData('assignment', { 
                        clientContact: { ...incorporationData.assignment.clientContact, name: e.target.value }
                      })}
                      placeholder="Client contact person"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={incorporationData.assignment.clientContact.email}
                      onChange={(e) => updateIncorporationData('assignment', { 
                        clientContact: { ...incorporationData.assignment.clientContact, email: e.target.value }
                      })}
                      placeholder="client@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={incorporationData.assignment.clientContact.phone}
                      onChange={(e) => updateIncorporationData('assignment', { 
                        clientContact: { ...incorporationData.assignment.clientContact, phone: e.target.value }
                      })}
                      placeholder="+51 999 123 456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
                    <select
                      value={incorporationData.assignment.clientContact.preferredContact}
                      onChange={(e) => updateIncorporationData('assignment', { 
                        clientContact: { ...incorporationData.assignment.clientContact, preferredContact: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Incorporation Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Company:</span> {incorporationData.basicInfo.companyName || 'Not specified'}</p>
                    <p><span className="font-medium">Entity Type:</span> {incorporationData.basicInfo.entityType}</p>
                    <p><span className="font-medium">Industry:</span> {incorporationData.basicInfo.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Share Capital:</span> S/ {incorporationData.shareholders.shareCapital.toLocaleString()}</p>
                    <p><span className="font-medium">Shareholders:</span> {incorporationData.shareholders.shareholders.length}</p>
                    <p><span className="font-medium">Office:</span> {incorporationData.assignment.office}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Step {currentStep} - In Development</h3>
            <p className="text-gray-600">This step includes the remaining Peru incorporation requirements.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Company Incorporation - Peru</h2>
              <p className="text-gray-600">Complete all required steps for Peru company incorporation</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[
              'Basic Info',
              'Shareholders',
              'Management',
              'Address',
              'Banking',
              'Legal',
              'Assignment'
            ].map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index + 1 < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index + 1 === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1 < currentStep ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-xs font-medium ${
                  index + 1 <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step}
                </span>
                {index < 6 && (
                  <div className={`ml-4 w-12 h-0.5 ${
                    index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 1 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {currentStep === totalSteps ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Submit Incorporation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewIncorporationModal; 