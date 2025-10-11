"use client";

import { useState, useEffect } from "react";
import { UserMeasurements } from "@/types/user";

type EditingSection = 'height' | 'dob' | 'bodyMeasurements' | 'sizingSystem' | 'usualSizes' | 'fitPreferences' | null;

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<UserMeasurements | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [saving, setSaving] = useState(false);

  // Edit state for each section
  const [editHeight, setEditHeight] = useState<number | undefined>();
  const [editDOB, setEditDOB] = useState("");
  const [editBodyMeasurements, setEditBodyMeasurements] = useState({ bust: undefined as number | undefined, waist: undefined as number | undefined, hips: undefined as number | undefined });
  const [editSizingSystem, setEditSizingSystem] = useState<'UK' | 'US' | 'EU'>('UK');
  const [editUsualSizes, setEditUsualSizes] = useState({ tops: [] as string[], bottoms: [] as string[], shoes: [] as string[] });
  const [editFitPreferences, setEditFitPreferences] = useState({ tops: "", bottoms: "" });

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const { profile } = await response.json();
        setMeasurements(profile?.measurements || null);
      }
    } catch (error) {
      console.error("Failed to load measurements:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section: EditingSection) => {
    if (!measurements) return;

    // Pre-fill edit state with current values
    if (section === 'height') {
      setEditHeight(measurements.height);
    } else if (section === 'dob') {
      setEditDOB(measurements.DOB || "");
    } else if (section === 'bodyMeasurements') {
      setEditBodyMeasurements({
        bust: measurements.bodyMeasurements?.bust,
        waist: measurements.bodyMeasurements?.waist,
        hips: measurements.bodyMeasurements?.hips,
      });
    } else if (section === 'sizingSystem') {
      setEditSizingSystem(measurements.preferredSizingSystem || 'UK');
    } else if (section === 'usualSizes') {
      setEditUsualSizes({
        tops: measurements.usualSize?.tops || [],
        bottoms: measurements.usualSize?.bottoms || [],
        shoes: measurements.usualSize?.shoes || [],
      });
    } else if (section === 'fitPreferences') {
      setEditFitPreferences({
        tops: measurements.fitPreference?.tops || "",
        bottoms: measurements.fitPreference?.bottoms || "",
      });
    }

    setEditingSection(section);
  };

  const cancelEditing = () => {
    setEditingSection(null);
  };

  const saveSection = async (section: EditingSection) => {
    if (!measurements) return;

    setSaving(true);
    try {
      const updatedMeasurements = { ...measurements };

      if (section === 'height') {
        updatedMeasurements.height = editHeight;
      } else if (section === 'dob') {
        updatedMeasurements.DOB = editDOB;
      } else if (section === 'bodyMeasurements') {
        updatedMeasurements.bodyMeasurements = {
          ...updatedMeasurements.bodyMeasurements,
          bust: editBodyMeasurements.bust,
          waist: editBodyMeasurements.waist,
          hips: editBodyMeasurements.hips,
          unit: 'cm',
        };
      } else if (section === 'sizingSystem') {
        updatedMeasurements.preferredSizingSystem = editSizingSystem;
      } else if (section === 'usualSizes') {
        updatedMeasurements.usualSize = editUsualSizes;
      } else if (section === 'fitPreferences') {
        updatedMeasurements.fitPreference = editFitPreferences;
      }

      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurements: updatedMeasurements }),
      });

      if (response.ok) {
        setMeasurements(updatedMeasurements);
        setEditingSection(null);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save measurements:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p style={{ color: "#6C6A68" }}>Loading your measurements...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!measurements) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p style={{ color: "#6C6A68" }}>No measurements found. Please complete your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const sizeOptions = {
    UK: ['6', '8', '10', '12', '14', '16', '18', '20', '22'],
    US: ['0', '2', '4', '6', '8', '10', '12', '14', '16'],
    EU: ['34', '36', '38', '40', '42', '44', '46', '48', '50'],
  };

  const shoeSizeOptions = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  const fitOptions = [
    { value: 'tight-fitted', label: 'Tight/Fitted' },
    { value: 'fitted', label: 'Fitted' },
    { value: 'true-to-size', label: 'True to Size' },
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'oversized', label: 'Oversized' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6" style={{ color: "#4E4B4B" }}>
            My Measurements
          </h1>
          <p
            className="text-sm max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#6C6A68" }}
          >
            Help us provide better size recommendations by sharing your
            measurements. This information is stored securely and only used to
            improve your shopping experience.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Measurements Summary */}
          <div className="bg-white rounded-2xl border border-stone-300 shadow-sm p-8 mb-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: "#4E4B4B" }}>
              Your Saved Measurements
            </h2>

            <div className="space-y-6">
              {/* Height */}
              <div className="border-b border-stone-200 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#4E4B4B" }}>
                    Height
                  </h3>
                  {editingSection !== 'height' && (
                    <button
                      onClick={() => startEditing('height')}
                      className="text-xs px-3 py-1 text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingSection === 'height' ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={editHeight || ""}
                      onChange={(e) => setEditHeight(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Height in cm"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg text-base"
                      style={{ color: "#4E4B4B" }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSection('height')}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base" style={{ color: "#6C6A68" }}>
                    {measurements.height ? (
                      `${measurements.height} cm (${Math.floor(measurements.height / 30.48)}'${Math.round((measurements.height % 30.48) / 2.54)}")`
                    ) : (
                      <span className="text-stone-400">Not set</span>
                    )}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="border-b border-stone-200 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#4E4B4B" }}>
                    Date of Birth
                  </h3>
                  {editingSection !== 'dob' && (
                    <button
                      onClick={() => startEditing('dob')}
                      className="text-xs px-3 py-1 text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingSection === 'dob' ? (
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={editDOB}
                      onChange={(e) => setEditDOB(e.target.value)}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg text-base"
                      style={{ color: "#4E4B4B" }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSection('dob')}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base" style={{ color: "#6C6A68" }}>
                    {measurements.DOB || <span className="text-stone-400">Not set</span>}
                  </p>
                )}
              </div>

              {/* Body Measurements */}
              <div className="border-b border-stone-200 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#4E4B4B" }}>
                    Body Measurements
                  </h3>
                  {editingSection !== 'bodyMeasurements' && (
                    <button
                      onClick={() => startEditing('bodyMeasurements')}
                      className="text-xs px-3 py-1 text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingSection === 'bodyMeasurements' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "#9CA3AF" }}>Bust (cm)</label>
                        <input
                          type="number"
                          value={editBodyMeasurements.bust || ""}
                          onChange={(e) => setEditBodyMeasurements({ ...editBodyMeasurements, bust: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Bust"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                          style={{ color: "#4E4B4B" }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "#9CA3AF" }}>Waist (cm)</label>
                        <input
                          type="number"
                          value={editBodyMeasurements.waist || ""}
                          onChange={(e) => setEditBodyMeasurements({ ...editBodyMeasurements, waist: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Waist"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                          style={{ color: "#4E4B4B" }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "#9CA3AF" }}>Hips (cm)</label>
                        <input
                          type="number"
                          value={editBodyMeasurements.hips || ""}
                          onChange={(e) => setEditBodyMeasurements({ ...editBodyMeasurements, hips: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Hips"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                          style={{ color: "#4E4B4B" }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSection('bodyMeasurements')}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {measurements.bodyMeasurements?.bust ? (
                      <div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Bust</p>
                        <p className="text-base font-medium" style={{ color: "#6C6A68" }}>
                          {measurements.bodyMeasurements.bust} cm
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Bust</p>
                        <p className="text-base text-stone-400">Not set</p>
                      </div>
                    )}
                    {measurements.bodyMeasurements?.waist ? (
                      <div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Waist</p>
                        <p className="text-base font-medium" style={{ color: "#6C6A68" }}>
                          {measurements.bodyMeasurements.waist} cm
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Waist</p>
                        <p className="text-base text-stone-400">Not set</p>
                      </div>
                    )}
                    {measurements.bodyMeasurements?.hips ? (
                      <div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Hips</p>
                        <p className="text-base font-medium" style={{ color: "#6C6A68" }}>
                          {measurements.bodyMeasurements.hips} cm
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>Hips</p>
                        <p className="text-base text-stone-400">Not set</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sizing System Preference */}
              <div className="border-b border-stone-200 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#4E4B4B" }}>
                    Preferred Sizing System
                  </h3>
                  {editingSection !== 'sizingSystem' && (
                    <button
                      onClick={() => startEditing('sizingSystem')}
                      className="text-xs px-3 py-1 text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingSection === 'sizingSystem' ? (
                  <div className="space-y-3">
                    <select
                      value={editSizingSystem}
                      onChange={(e) => setEditSizingSystem(e.target.value as 'UK' | 'US' | 'EU')}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg text-base"
                      style={{ color: "#4E4B4B" }}
                    >
                      <option value="UK">UK</option>
                      <option value="US">US</option>
                      <option value="EU">EU</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSection('sizingSystem')}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base" style={{ color: "#6C6A68" }}>
                    {measurements.preferredSizingSystem || <span className="text-stone-400">Not set</span>}
                  </p>
                )}
              </div>

              {/* Usual Sizes */}
              <div className="border-b border-stone-200 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#4E4B4B" }}>
                    Usual Sizes
                  </h3>
                  {editingSection !== 'usualSizes' && (
                    <button
                      onClick={() => startEditing('usualSizes')}
                      className="text-xs px-3 py-1 text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingSection === 'usualSizes' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: "#9CA3AF" }}>Tops ({editSizingSystem})</label>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions[editSizingSystem].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              const newTops = editUsualSizes.tops.includes(size)
                                ? editUsualSizes.tops.filter(s => s !== size)
                                : [...editUsualSizes.tops, size];
                              setEditUsualSizes({ ...editUsualSizes, tops: newTops });
                            }}
                            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                              editUsualSizes.tops.includes(size)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: "#9CA3AF" }}>Bottoms ({editSizingSystem})</label>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions[editSizingSystem].map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              const newBottoms = editUsualSizes.bottoms.includes(size)
                                ? editUsualSizes.bottoms.filter(s => s !== size)
                                : [...editUsualSizes.bottoms, size];
                              setEditUsualSizes({ ...editUsualSizes, bottoms: newBottoms });
                            }}
                            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                              editUsualSizes.bottoms.includes(size)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: "#9CA3AF" }}>Shoes (EU)</label>
                      <div className="flex flex-wrap gap-2">
                        {shoeSizeOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setEditUsualSizes({ ...editUsualSizes, shoes: [size] });
                            }}
                            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                              editUsualSizes.shoes.includes(size)
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-black border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSection('usualSizes')}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Tops</p>
                      <p className="text-base" style={{ color: "#6C6A68" }}>
                        {measurements.usualSize?.tops && measurements.usualSize.tops.length > 0
                          ? measurements.usualSize.tops.join(", ")
                          : <span className="text-stone-400">Not set</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Bottoms</p>
                      <p className="text-base" style={{ color: "#6C6A68" }}>
                        {measurements.usualSize?.bottoms && measurements.usualSize.bottoms.length > 0
                          ? measurements.usualSize.bottoms.join(", ")
                          : <span className="text-stone-400">Not set</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Shoes (EU)</p>
                      <p className="text-base" style={{ color: "#6C6A68" }}>
                        {measurements.usualSize?.shoes && measurements.usualSize.shoes.length > 0
                          ? measurements.usualSize.shoes.join(", ")
                          : <span className="text-stone-400">Not set</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Fit Preferences */}
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold" style={{ color: "#4E4B4B" }}>
                    Fit Preferences
                  </h3>
                  {editingSection !== 'fitPreferences' && (
                    <button
                      onClick={() => startEditing('fitPreferences')}
                      className="text-xs px-3 py-1 text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingSection === 'fitPreferences' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: "#9CA3AF" }}>Tops</label>
                      <select
                        value={editFitPreferences.tops}
                        onChange={(e) => setEditFitPreferences({ ...editFitPreferences, tops: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg text-base"
                        style={{ color: "#4E4B4B" }}
                      >
                        <option value="">Select fit preference</option>
                        {fitOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: "#9CA3AF" }}>Bottoms</label>
                      <select
                        value={editFitPreferences.bottoms}
                        onChange={(e) => setEditFitPreferences({ ...editFitPreferences, bottoms: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg text-base"
                        style={{ color: "#4E4B4B" }}
                      >
                        <option value="">Select fit preference</option>
                        {fitOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSection('fitPreferences')}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-black border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Tops</p>
                      <p className="text-base capitalize" style={{ color: "#6C6A68" }}>
                        {measurements.fitPreference?.tops
                          ? measurements.fitPreference.tops.replace(/-/g, " ")
                          : <span className="text-stone-400">Not set</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Bottoms</p>
                      <p className="text-base capitalize" style={{ color: "#6C6A68" }}>
                        {measurements.fitPreference?.bottoms
                          ? measurements.fitPreference.bottoms.replace(/-/g, " ")
                          : <span className="text-stone-400">Not set</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "#4E4B4B" }}
            >
              Privacy & Security
            </h3>
            <ul className="text-xs space-y-2" style={{ color: "#6C6A68" }}>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                Your measurements are encrypted and stored securely
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                Only you can view and edit your data
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                We never share your personal information
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                You can delete your data anytime
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
