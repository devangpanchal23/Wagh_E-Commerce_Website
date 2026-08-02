import React, { useState, useEffect } from 'react';
import { Phone, Calendar, UserCheck, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function ProfileDetailsForm({ profile, onSaveDetails }) {
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || profile.phoneNumber || profile.mobileNumber || '');
      setBirthdate(profile.birthdate || profile.dob || '');
      setGender(profile.gender || 'prefer_not_to_say');
    }
  }, [profile]);

  const originalPhone = profile?.phone || profile?.phoneNumber || profile?.mobileNumber || '';
  const originalBirthdate = profile?.birthdate || profile?.dob || '';
  const originalGender = profile?.gender || 'prefer_not_to_say';

  const isDirty =
    phone.trim() !== originalPhone ||
    birthdate !== originalBirthdate ||
    gender !== originalGender;

  const validate = () => {
    const errors = {};
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      errors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (birthdate) {
      const birthDateObj = new Date(birthdate);
      const today = new Date();
      if (birthDateObj > today) {
        errors.birthdate = 'Birthdate cannot be in the future';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);

    if (!validate()) {
      addToast('Please fix errors in the form before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await onSaveDetails({
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        mobileNumber: phone.trim(),
        birthdate,
        gender,
      });

      if (res && res.success) {
        setSavedSuccess(true);
        addToast('Account details updated successfully!', 'success');
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        addToast(res?.message || 'Failed to update account details', 'error');
      }
    } catch (err) {
      console.error('Update profile form error:', err);
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-wagh-border p-6 sm:p-8 shadow-soft space-y-6">
      <div className="border-b border-wagh-border pb-4">
        <h3 className="font-editorial text-xl font-bold text-wagh-dark">Account Details</h3>
        <p className="text-xs text-wagh-muted font-mono-tag">Update your personal contact information</p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your account details have been saved to your account profile.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Mobile Number (10 Digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                }}
                placeholder="9876543210"
                className={`w-full pl-9 pr-3 py-3 rounded-xl border text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.phone
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.phone ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fieldErrors.phone}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Provide a 10-digit mobile number for SMS notifications</p>
            )}
          </div>

          {/* Birthdate */}
          <div>
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Birthdate
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={birthdate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setBirthdate(e.target.value);
                  if (fieldErrors.birthdate) setFieldErrors((prev) => ({ ...prev, birthdate: null }));
                }}
                className={`w-full pl-9 pr-3 py-3 rounded-xl border text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all bg-white ${
                  fieldErrors.birthdate
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.birthdate ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fieldErrors.birthdate}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Select your date of birth</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Gender
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <p className="text-[11px] text-wagh-muted mt-1">Select gender option</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="px-6 py-3 rounded-full bg-wagh-teal text-white font-extrabold text-xs hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>

          {!isDirty && (
            <span className="text-xs text-wagh-muted italic">No unsaved changes</span>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProfileDetailsForm;
