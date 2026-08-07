import React, { useState, useEffect } from 'react';
import { Phone, Calendar, UserCheck, Save, AlertCircle, CheckCircle2, Mail, Hash } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Client-side age calculation helper
const calculateAge = (dobStr) => {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const normalizeBirthdate = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

export function ProfileDetailsForm({ profile, onSaveDetails }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
      setPhone(profile.phone || profile.phoneNumber || profile.mobileNumber || '');
      setBirthdate(normalizeBirthdate(profile.birthdate || profile.dob || ''));
      setGender(profile.gender || 'prefer_not_to_say');
    }
  }, [profile]);

  const originalEmail = profile?.email || '';
  const originalPhone = profile?.phone || profile?.phoneNumber || profile?.mobileNumber || '';
  const originalBirthdate = normalizeBirthdate(profile?.birthdate || profile?.dob || '');
  const originalGender = profile?.gender || 'prefer_not_to_say';

  const isDirty =
    email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() ||
    phone.trim() !== originalPhone ||
    birthdate !== originalBirthdate ||
    gender !== originalGender;

  const currentAge = birthdate ? calculateAge(birthdate) : (profile?.age ?? null);

  const validate = () => {
    const errors = {};
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanEmail) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
      errors.phone = 'Mobile number must be a valid 10-digit number';
    }

    if (birthdate) {
      const birthDateObj = new Date(birthdate);
      const today = new Date();
      if (isNaN(birthDateObj.getTime())) {
        errors.birthdate = 'Please enter a valid date of birth';
      } else if (birthDateObj > today) {
        errors.birthdate = 'Date of birth cannot be in the future';
      } else {
        const computed = calculateAge(birthdate);
        if (computed !== null && (computed < 13 || computed > 100)) {
          errors.birthdate = 'Age derived from birthdate must be between 13 and 100 years';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);

    if (!validate()) {
      addToast('Please fix validation errors in the form before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const computedAge = birthdate ? calculateAge(birthdate) : profile?.age;
      const res = await onSaveDetails({
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        mobileNumber: phone.trim(),
        birthdate,
        age: computedAge,
        gender,
      });

      if (res && res.success) {
        setSavedSuccess(true);
        addToast('Account profile saved permanently to database!', 'success');
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        addToast(res?.message || 'Failed to update profile details', 'error');
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
      <div className="border-b border-wagh-border pb-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div>
          <h3 className="font-editorial text-xl font-bold text-wagh-dark">Account Profile</h3>
          <p className="text-xs text-wagh-muted font-mono-tag">Personal information linked to your account ID</p>
        </div>
        {currentAge !== null && (
          <span className="px-3 py-1.5 rounded-full bg-wagh-teal/10 text-wagh-teal font-mono-tag font-bold text-xs border border-wagh-teal/20 whitespace-nowrap shrink-0 inline-flex items-center shadow-2xs">
            Age: {currentAge} yrs old
          </span>
        )}
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your profile details have been saved permanently to the database.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Email Address */}
          <div className="min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="customer@example.com"
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.email
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.email ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Primary contact email</p>
            )}
          </div>

          {/* Mobile Number */}
          <div className="min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Mobile Number (10 Digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                }}
                placeholder="10-digit mobile number"
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.phone
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.phone ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.phone}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Mobile number for SMS updates</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="date"
                value={birthdate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setBirthdate(e.target.value);
                  if (fieldErrors.birthdate) setFieldErrors((prev) => ({ ...prev, birthdate: null }));
                }}
                placeholder="YYYY-MM-DD"
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all bg-white ${
                  fieldErrors.birthdate
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.birthdate ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.birthdate}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Select date of birth</p>
            )}
          </div>
        </div>

        {/* Calculated Age & Gender Identity Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-wagh-border/80">
          {/* Calculated Age */}
          <div className="min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Calculated Age
            </label>
            <div className="relative flex items-center min-w-0">
              <Hash className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                readOnly
                value={currentAge !== null && currentAge !== undefined ? `${currentAge} years old` : 'N/A (Select DOB)'}
                className="w-full min-w-0 pl-9 pr-3 py-2.5 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white text-wagh-dark font-bold cursor-not-allowed truncate"
              />
            </div>
          </div>

          {/* Gender Selector Pills */}
          <div className="sm:col-span-2 space-y-1 min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Gender Identity
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'prefer_not_to_say', label: 'Unspecified' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    gender === g.value
                      ? 'bg-wagh-teal text-white shadow-sm font-bold ring-2 ring-wagh-teal/30'
                      : 'bg-white border border-wagh-border text-wagh-dark hover:bg-gray-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-wagh-teal text-white font-extrabold text-xs sm:text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>

          {!isDirty && (
            <span className="text-xs text-wagh-muted italic text-center sm:text-left">No unsaved changes</span>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProfileDetailsForm;
