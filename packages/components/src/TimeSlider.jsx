/* eslint-disable react/no-array-index-key */
// array maps being used are static, this is fine.

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TimeInput from './TimeInput';
import StyleExports from './TimeSlider.module.scss';
import './TimeSlider.scss';

const HANDLE_SIZE = parseInt(StyleExports['handle-size'], 10);
const POPOVER_WIDTH = parseInt(StyleExports['popover-width'], 10);
const SECONDS_IN_DAY = 24 * 60 * 60 - 1; // Max is actually 23:59:59
const SNAP_NEAREST_MINUTES = 5 * 60; // rounds in 5 minute intervals

/**
 * Creates a time slider for setting a start and end time, that can also run overnight
 * @param {startTime, endTime, onChange} props takes times in seconds 0 - 86399 and a callback
 */
const TimeSlider = props => {
  const {
    startTime: propStartTime,
    endTime: propEndTime,
    onChange,
    isStartModified,
    isEndModified,
  } = props;
  const [startTime, setStartTime] = useState(propStartTime);
  const [endTime, setEndTime] = useState(propEndTime);

  const track = useRef(null); // we need the track width while calulculating time from handle drag

  // updates state if props change
  useEffect(() => {
    setStartTime(propStartTime);
    setEndTime(propEndTime);
  }, [propStartTime, propEndTime]);

  const updateTime = useCallback(
    (newStartTime, newEndTime) => {
      let start = newStartTime;
      let end = newEndTime;
      if (start === end) {
        if (end < SECONDS_IN_DAY) {
          end += 1;
        } else {
          start -= 1;
        }
      }

      setStartTime(start);
      setEndTime(end);
      onChange({ startTime: start, endTime: end });
    },
    [setStartTime, setEndTime, onChange]
  );

  const handleStartTimeChange = useCallback(
    newStartTime => {
      updateTime(newStartTime, endTime);
    },
    [updateTime, endTime]
  );

  const handleEndTimeChange = useCallback(
    newEndTime => {
      updateTime(startTime, newEndTime);
    },
    [updateTime, startTime]
  );

  return (
    <div className="time-slider">
      <PopOvers
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={handleStartTimeChange}
        onEndTimeChange={handleEndTimeChange}
        isStartModified={isStartModified}
        isEndModified={isEndModified}
      />
      <div className="track" ref={track}>
        <TrackFills startTime={startTime} endTime={endTime} />
        <div className="ticks">
          {Array(24)
            .fill(null)
            .map((value, index) => (
              <div className="tick" key={index} />
            ))}
        </div>
        <Handle
          track={track}
          time={startTime}
          setTime={handleStartTimeChange}
        />
        <Handle track={track} time={endTime} setTime={handleEndTimeChange} />
      </div>

      <div className="tick-labels">
        <div className="tick-label">0:00</div>
        <div className="tick-label-wrapper">
          {Array(24)
            .fill(null)
            .map((value, index) => (
              <div className="tick-label" key={index}>{`${index + 1}:00`}</div>
            ))}
        </div>
      </div>
    </div>
  );
};

const PopOvers = props => {
  const {
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    isStartModified,
    isEndModified,
  } = props;

  const [firstTime, setFirstTime] = useState(
    startTime > endTime ? endTime : startTime
  );
  const [secondTime, setSecondTime] = useState(
    startTime > endTime ? startTime : endTime
  );

  useEffect(() => {
    setFirstTime(startTime > endTime ? endTime : startTime);
    setSecondTime(startTime > endTime ? startTime : endTime);
  }, [startTime, endTime]);

  function onFirstTimeChange(value) {
    if (startTime <= endTime) {
      onStartTimeChange(value);
    } else {
      onEndTimeChange(value);
    }
  }

  function onSecondTimeChange(value) {
    if (startTime <= endTime) {
      onEndTimeChange(value);
    } else {
      onStartTimeChange(value);
    }
  }

  return (
    <div className="time-slider-popovers">
      <div
        className="flex"
        style={{
          flexBasis: `calc(${(firstTime / SECONDS_IN_DAY) * 100}% - ${
            POPOVER_WIDTH / 2
          }px)`,
        }}
      />
      <div className="handle-popper">
        <label
          className={classNames({
            modified: startTime < endTime ? isStartModified : isEndModified,
          })}
        >
          {startTime <= endTime ? 'Start Time' : 'End Time'}
        </label>
        <TimeInput
          allowValueWrapping={false}
          value={firstTime}
          onChange={onFirstTimeChange}
        />
      </div>
      <div className="flex-spacer" />
      <div className="handle-popper">
        <label
          className={classNames({
            modified: startTime > endTime ? isStartModified : isEndModified,
          })}
        >
          {startTime > endTime ? 'Start Time' : 'End Time'}
        </label>
        <TimeInput
          allowValueWrapping={false}
          value={secondTime}
          onChange={onSecondTimeChange}
        />
      </div>
      <div
        className="flex"
        style={{
          flexBasis: `calc(${
            ((SECONDS_IN_DAY - secondTime) / SECONDS_IN_DAY) * 100
          }% - ${POPOVER_WIDTH / 2}px)`,
        }}
      />
    </div>
  );
};

/**
 * Shades the area between or outside of handles according to if start or endtime is greater.
 */
const TrackFills = props => {
  const { startTime, endTime } = props;
  return (
    <div className="track-fills">
      {startTime > endTime && (
        <>
          <div
            className="track-fill track-fill-start"
            style={{ transform: `scaleX(${endTime / SECONDS_IN_DAY})` }}
          />
          <div
            className="track-fill track-fill-end"
            style={{
              transform: `scaleX(${
                (SECONDS_IN_DAY - startTime) / SECONDS_IN_DAY
              })`,
            }}
          />
        </>
      )}
      {startTime < endTime && (
        <div
          className="track-fill track-fill-middle"
          style={{
            transform: `translateX(${
              (startTime / SECONDS_IN_DAY) * 100
            }%) scaleX(${(endTime - startTime) / SECONDS_IN_DAY})`,
          }}
        />
      )}
    </div>
  );
};

/**
 * Creates a draggable handle the sets the time
 */
const Handle = props => {
  const { track, time, setTime } = props;

  /**
   * Takes the time and generate our translation string taking into account handle offset.
   * The handle offset changes for the first and last tick range dynmaically. Normally,
   * the center of the handle (size/2) is the selection origin, but at edges, it becomes either
   * end of the handle, requireing a relative offset range of 0 - 0.5,  and 0.5 - 1 of handle size.
   * @param {number} t time in seconds
   */
  const transform = useMemo(() => {
    const ONE_HOUR = 60 * 60;
    let handleOffset = HANDLE_SIZE / 2;
    if (time < ONE_HOUR) {
      handleOffset = (time / ONE_HOUR) * (HANDLE_SIZE / 2); // 0 - 0.5 Handle size
    } else if (time > 23 * ONE_HOUR) {
      handleOffset =
        HANDLE_SIZE / 2 +
        (1 / (SECONDS_IN_DAY - 23 * ONE_HOUR)) *
          (time - 23 * ONE_HOUR) *
          (HANDLE_SIZE / 2); // 0.5 - 1 Handle size
    }
    return `translateX(calc(${
      (time / SECONDS_IN_DAY) * 100
    }% - ${handleOffset}px))`;
  }, [time]);

  const calculatePositionAsTime = useCallback(
    clientX => {
      const trackRect = track.current.getBoundingClientRect();
      const leftEdge = Math.max(clientX - trackRect.left, 0);
      // get position as 0-1 on slider and mulitply by seconds in a day to convert to time
      const preciseTime =
        SECONDS_IN_DAY * Math.min(1, leftEdge / trackRect.width);
      // snap to nearest N(5) minute interval
      const roundedTime =
        SNAP_NEAREST_MINUTES * Math.round(preciseTime / SNAP_NEAREST_MINUTES);
      // prevent over-rounding to 24:00:00
      const limitMax = Math.min(SECONDS_IN_DAY, roundedTime);
      return limitMax;
    },
    [track]
  );

  const handleMouseMove = useCallback(
    ({ clientX }) => {
      setTime(calculatePositionAsTime(clientX));
    },
    [setTime, calculatePositionAsTime]
  );

  const handleMouseUp = useCallback(
    ({ clientX }) => {
      setTime(calculatePositionAsTime(clientX));

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.classList.remove('drag-pointer-events-none');
    },
    [setTime, calculatePositionAsTime, handleMouseMove]
  );

  const startDragListening = useCallback(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.classList.add('drag-pointer-events-none');
  }, [handleMouseMove, handleMouseUp]);

  const stopDragListening = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.documentElement.classList.remove('drag-pointer-events-none');
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback(() => {
    startDragListening();
  }, [startDragListening]);

  useEffect(
    () => () => {
      stopDragListening();
    },
    [stopDragListening]
  );

  return (
    <div className="handle-track" style={{ transform }}>
      <button
        className="handle"
        type="button"
        aria-label="Change time"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

TimeSlider.propTypes = {
  startTime: PropTypes.number.isRequired,
  endTime: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  isStartModified: PropTypes.bool,
  isEndModified: PropTypes.bool,
};

TimeSlider.defaultProps = {
  isStartModified: false,
  isEndModified: false,
};

TrackFills.propTypes = {
  startTime: PropTypes.number.isRequired,
  endTime: PropTypes.number.isRequired,
};

PopOvers.propTypes = {
  startTime: PropTypes.number.isRequired,
  endTime: PropTypes.number.isRequired,
  onStartTimeChange: PropTypes.func.isRequired,
  onEndTimeChange: PropTypes.func.isRequired,
  isStartModified: PropTypes.bool.isRequired,
  isEndModified: PropTypes.bool.isRequired,
};

Handle.propTypes = {
  track: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  time: PropTypes.number.isRequired,
  setTime: PropTypes.func.isRequired,
};

export default TimeSlider;
