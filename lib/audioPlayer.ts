/**
 * Safe Audio Player Adapter
 * Tries expo-audio first, then expo-av, and falls back to a simulated playback timer
 * if running in an Expo Go environment that lacks native audio modules.
 */

export interface PlaybackCallback {
  (status: { positionMs: number; durationMs: number; isPlaying: boolean; didJustFinish: boolean }): void;
}

class SafeAudioPlayer {
  private mode: 'expo-audio' | 'expo-av' | 'mock' = 'mock';
  private avSound: any = null;
  private audioPlayer: any = null;
  private audioSubscription: any = null;
  private mockTimer: any = null;
  private mockPositionMs = 0;
  private mockDurationMs = 180000;
  private isPlaying = false;
  private callback: PlaybackCallback | null = null;
  private initialized = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    // Try expo-audio first
    try {
      const expoAudio = require('expo-audio');
      if (expoAudio && expoAudio.createAudioPlayer) {
        this.mode = 'expo-audio';
        console.log('[SafeAudioPlayer] Initialized with expo-audio');
        return;
      }
    } catch {
      // expo-audio not available
    }

    // Try expo-av
    try {
      const expoAv = require('expo-av');
      if (expoAv && expoAv.Audio) {
        this.mode = 'expo-av';
        console.log('[SafeAudioPlayer] Initialized with expo-av');
        return;
      }
    } catch {
      // expo-av not available
    }

    console.warn(
      '[SafeAudioPlayer] Native audio module not found. Using simulated playback.'
    );
    this.mode = 'mock';
  }

  async load(uri: string, durationSec = 180, onUpdate: PlaybackCallback) {
    this.init();
    this.callback = onUpdate;
    await this.unload();

    const fallbackDurationMs = durationSec > 0 ? durationSec * 1000 : 180000;

    // 1. Try expo-audio
    if (this.mode === 'expo-audio') {
      try {
        const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        }).catch(() => {});

        const player = createAudioPlayer(uri, { updateInterval: 200 });
        this.audioPlayer = player;
        this.isPlaying = true;

        this.audioSubscription = player.addListener('playbackStatusUpdate', (status: any) => {
          if (!status) return;
          const posSec = typeof status.currentTime === 'number' ? status.currentTime : 0;
          const durSec = (typeof status.duration === 'number' && status.duration > 0)
            ? status.duration
            : durationSec;
          const isPlaying = Boolean(status.playing);
          const didJustFinish = Boolean(status.didJustFinish);

          this.isPlaying = isPlaying;
          onUpdate({
            positionMs: Math.round(posSec * 1000),
            durationMs: Math.round(durSec * 1000),
            isPlaying,
            didJustFinish,
          });
        });

        player.play();
        return;
      } catch (err) {
        console.warn('[SafeAudioPlayer] expo-audio load failed, falling back to expo-av:', err);
        this.mode = 'expo-av';
      }
    }

    // 2. Try expo-av
    if (this.mode === 'expo-av') {
      try {
        const { Audio } = require('expo-av');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        }).catch(() => {});

        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 200 },
          (status: any) => {
            if (!status.isLoaded) return;
            this.isPlaying = status.isPlaying;
            onUpdate({
              positionMs: status.positionMillis ?? 0,
              durationMs: (status.durationMillis && status.durationMillis > 0)
                ? status.durationMillis
                : fallbackDurationMs,
              isPlaying: status.isPlaying,
              didJustFinish: Boolean(status.didJustFinish),
            });
          }
        );
        this.avSound = sound;
        this.isPlaying = true;
        return;
      } catch (err) {
        console.warn('[SafeAudioPlayer] expo-av playback failed, falling back to simulation:', err);
        this.mode = 'mock';
      }
    }

    // 3. Fallback simulation
    this.mockPositionMs = 0;
    this.mockDurationMs = fallbackDurationMs;
    this.isPlaying = true;
    this.startMockTimer();
  }

  async play() {
    this.isPlaying = true;
    if (this.mode === 'expo-audio' && this.audioPlayer) {
      try {
        this.audioPlayer.play();
      } catch (e) {
        console.warn('[SafeAudioPlayer] expo-audio play error:', e);
      }
      this.notifyUpdate(false);
      return;
    }
    if (this.mode === 'expo-av' && this.avSound) {
      try {
        await this.avSound.playAsync();
      } catch (e) {
        console.warn('[SafeAudioPlayer] expo-av play error:', e);
      }
      this.notifyUpdate(false);
      return;
    }
    this.startMockTimer();
  }

  async pause() {
    this.isPlaying = false;
    if (this.mode === 'expo-audio' && this.audioPlayer) {
      try {
        this.audioPlayer.pause();
      } catch (e) {
        console.warn('[SafeAudioPlayer] expo-audio pause error:', e);
      }
      this.notifyUpdate(false);
      return;
    }
    if (this.mode === 'expo-av' && this.avSound) {
      try {
        await this.avSound.pauseAsync();
      } catch (e) {
        console.warn('[SafeAudioPlayer] expo-av pause error:', e);
      }
      this.notifyUpdate(false);
      return;
    }
    this.stopMockTimer();
    this.notifyUpdate(false);
  }

  async seek(positionMs: number) {
    if (this.mode === 'expo-audio' && this.audioPlayer) {
      try {
        await this.audioPlayer.seekTo(positionMs / 1000);
      } catch (e) {
        console.warn('[SafeAudioPlayer] expo-audio seek error:', e);
      }
      return;
    }
    if (this.mode === 'expo-av' && this.avSound) {
      try {
        await this.avSound.setPositionAsync(positionMs);
      } catch (e) {
        console.warn('[SafeAudioPlayer] expo-av seek error:', e);
      }
      return;
    }
    this.mockPositionMs = positionMs;
    this.notifyUpdate(false);
  }

  async unload() {
    this.isPlaying = false;
    this.stopMockTimer();

    if (this.audioSubscription) {
      try {
        this.audioSubscription.remove();
      } catch {
        // ignore
      }
      this.audioSubscription = null;
    }

    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.remove();
      } catch {
        // ignore
      }
      this.audioPlayer = null;
    }

    if (this.avSound) {
      try {
        await this.avSound.stopAsync().catch(() => {});
        await this.avSound.unloadAsync().catch(() => {});
      } catch {
        // ignore
      }
      this.avSound = null;
    }

    this.mockPositionMs = 0;
  }

  private startMockTimer() {
    this.stopMockTimer();
    this.notifyUpdate(false);
    this.mockTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.mockPositionMs += 250;
      if (this.mockPositionMs >= this.mockDurationMs) {
        this.mockPositionMs = this.mockDurationMs;
        this.stopMockTimer();
        this.isPlaying = false;
        this.notifyUpdate(true);
      } else {
        this.notifyUpdate(false);
      }
    }, 250);
  }

  private stopMockTimer() {
    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = null;
    }
  }

  private notifyUpdate(didJustFinish: boolean) {
    if (this.callback) {
      this.callback({
        positionMs: this.mockPositionMs,
        durationMs: this.mockDurationMs,
        isPlaying: this.isPlaying,
        didJustFinish,
      });
    }
  }
}

export const safeAudioPlayer = new SafeAudioPlayer();

/**
 * Probes the duration of an audio file in seconds using expo-audio (Expo SDK 57 standard).
 * Inspects file header/metadata without playing audio, and frees resources immediately.
 */
export async function probeAudioDuration(uri: string): Promise<number | null> {
  try {
    const { createAudioPlayer } = require('expo-audio');
    if (createAudioPlayer) {
      const player = createAudioPlayer({ uri });
      // Ensure player remains silent while probing metadata
      try {
        player.volume = 0;
        player.muted = true;
      } catch {}

      let durationSec: number | null = null;
      if (typeof player.duration === 'number' && player.duration > 0) {
        durationSec = Math.round(player.duration);
      } else if (
        player.currentStatus &&
        typeof player.currentStatus.duration === 'number' &&
        player.currentStatus.duration > 0
      ) {
        durationSec = Math.round(player.currentStatus.duration);
      } else {
        durationSec = await new Promise<number | null>((resolve) => {
          let resolved = false;
          let sub: any = null;

          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              if (sub && typeof sub.remove === 'function') {
                sub.remove();
              }
              const fallback =
                typeof player.duration === 'number' && player.duration > 0
                  ? Math.round(player.duration)
                  : player.currentStatus?.duration
                  ? Math.round(player.currentStatus.duration)
                  : null;
              resolve(fallback);
            }
          }, 2000);

          if (typeof player.addListener === 'function') {
            sub = player.addListener('playbackStatusUpdate', (status: any) => {
              const dur =
                status && typeof status.duration === 'number' && status.duration > 0
                  ? status.duration
                  : typeof player.duration === 'number' && player.duration > 0
                  ? player.duration
                  : null;

              if (dur && !resolved) {
                resolved = true;
                clearTimeout(timer);
                if (sub && typeof sub.remove === 'function') {
                  sub.remove();
                }
                resolve(Math.round(dur));
              }
            });
          }
        });
      }

      try {
        if (typeof player.remove === 'function') {
          player.remove();
        }
      } catch {}

      if (durationSec && durationSec > 0) {
        return durationSec;
      }
    }
  } catch (err) {
    console.warn('[probeAudioDuration] expo-audio probe error:', err);
  }

  return null;
}
