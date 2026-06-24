/**
 * useChallengeDeadline
 *
 * Computes the 30-day Super-Connector challenge countdown
 * based on the account creation date (createdAt from the API).
 * Returns time remaining and whether the challenge has expired.
 */

import { useState, useEffect, useRef } from 'react';

const CHALLENGE_DAYS = 30;
const CHALLENGE_MS = CHALLENGE_DAYS * 24 * 60 * 60 * 1000;

export interface ChallengeDeadline {
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const EXPIRED: ChallengeDeadline = {
  isExpired: true,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export function useChallengeDeadline(createdAt: string | undefined): ChallengeDeadline {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deadline = createdAt ? new Date(createdAt).getTime() + CHALLENGE_MS : null;

  useEffect(() => {
    if (deadline === null) return;

    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadline]);

  if (deadline === null) return EXPIRED;

  const remaining = Math.max(0, deadline - now);
  if (remaining === 0) return EXPIRED;

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { isExpired: false, days, hours, minutes, seconds };
}
