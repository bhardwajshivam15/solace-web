import { useState } from "react";
import { Clock } from "lucide-react";
import { weeklyAvailability, todaysSchedule } from "../data/mockData";
import { useAppData } from "../context/AppDataContext";
import type { AvailabilitySlot } from "../types";
import ToggleSwitch from "../components/ToggleSwitch";

export default function Availability() {
  const { listenerOnline, toggleListenerOnline } = useAppData();
  const [schedule, setSchedule] = useState<AvailabilitySlot[]>(weeklyAvailability);

  const toggleDay = (day: string) => {
    setSchedule((prev) =>
      prev.map((slot) =>
        slot.day === day ? { ...slot, enabled: !slot.enabled } : slot,
      ),
    );
  };

  const updateTime = (day: string, field: "from" | "to", value: string) => {
    setSchedule((prev) =>
      prev.map((slot) => (slot.day === day ? { ...slot, [field]: value } : slot)),
    );
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Availability</h1>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-soft">
        <div>
          <p className="text-sm text-brand-100">Your Status</p>
          <p className="mt-1 text-2xl font-bold">
            {listenerOnline ? "You're online" : "You're offline"}
          </p>
          <p className="mt-1 text-sm text-brand-100">
            {listenerOnline
              ? "You can receive new listener requests."
              : "You won't receive new requests until you go online."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3">
          <span className="text-sm font-semibold">
            {listenerOnline ? "Online" : "Offline"}
          </span>
          <ToggleSwitch
            checked={listenerOnline}
            onChange={toggleListenerOnline}
            tone="inverted"
            aria-label="Toggle online status"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Weekly Schedule</p>
        <div className="mt-4 space-y-2">
          {schedule.map((slot) => (
            <div
              key={slot.day}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
            >
              <ToggleSwitch
                checked={slot.enabled}
                onChange={() => toggleDay(slot.day)}
                aria-label={`Toggle ${slot.day} availability`}
              />

              <span className="w-24 shrink-0 text-sm font-medium text-ink-900">
                {slot.day}
              </span>

              {slot.enabled ? (
                <div className="flex flex-1 flex-wrap items-center gap-2 text-sm text-gray-500">
                  <input
                    value={slot.from}
                    onChange={(event) =>
                      updateTime(slot.day, "from", event.target.value)
                    }
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs text-ink-900"
                  />
                  <span>to</span>
                  <input
                    value={slot.to}
                    onChange={(event) =>
                      updateTime(slot.day, "to", event.target.value)
                    }
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs text-ink-900"
                  />
                </div>
              ) : (
                <span className="flex-1 text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-600" />
          <p className="font-semibold text-ink-900">Today's Schedule</p>
        </div>
        <div className="mt-3 space-y-2">
          {todaysSchedule.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 font-medium text-gray-500">
                {item.time}
              </span>
              <span className="text-ink-900">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
