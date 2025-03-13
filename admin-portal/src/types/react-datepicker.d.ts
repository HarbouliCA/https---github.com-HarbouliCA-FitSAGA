declare module 'react-datepicker' {
  import React from 'react';
  
  export interface ReactDatePickerProps {
    selected?: Date | null;
    onChange?: (date: Date | null, event: React.SyntheticEvent<any> | undefined) => void;
    onSelect?: (date: Date | null, event: React.SyntheticEvent<any> | undefined) => void;
    onClickOutside?: (event: React.MouseEvent<HTMLDivElement>) => void;
    onCalendarOpen?: () => void;
    onCalendarClose?: () => void;
    onMonthChange?: (date: Date) => void;
    onYearChange?: (date: Date) => void;
    onInputClick?: () => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
    onInputError?: (err: Error) => void;
    
    // Customization
    className?: string;
    dateFormat?: string | string[];
    placeholderText?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    showTimeSelect?: boolean;
    timeFormat?: string;
    timeIntervals?: number;
    
    // And many more props...
    [key: string]: any;
  }
  
  export default class DatePicker extends React.Component<ReactDatePickerProps> {}
}
