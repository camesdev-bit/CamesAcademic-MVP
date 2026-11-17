type IconProps = { className?: string };

function make(paths: React.ReactNode) {
  return function Icon({ className = "h-5 w-5" }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

export const HomeIcon = make(
  <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
);

export const BookIcon = make(
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
);

export const ChartIcon = make(<path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />);

export const HubIcon = make(<path d="M14 4h6v6m0-6L10 14M9 20H3v-6" />);

export const UploadIcon = make(
  <>
    <path d="M12 15V3m0 0 4.5 4.5M12 3 7.5 7.5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </>
);

export const FileIcon = make(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
    <path d="M14 2v6h6" />
  </>
);

export const TextIcon = make(
  <>
    <path d="M4 7V5h16v2" />
    <path d="M12 5v14M9 19h6" />
  </>
);

export const SparkIcon = make(
  <>
    <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
    <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
  </>
);

export const ChatIcon = make(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />);

export const LayersIcon = make(
  <>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
  </>
);

export const ClipboardIcon = make(
  <>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0" />
    <path d="m9 14 2 2 4-4" />
  </>
);

export const ReportIcon = make(
  <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
);

export const CheckIcon = make(<path d="m5 13 4 4L19 7" />);

export const CheckCircleIcon = make(
  <>
    <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
    <path d="m22 4-10 10.1-3-3" />
  </>
);

export const XIcon = make(<path d="M18 6 6 18M6 6l12 12" />);

export const XCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </>
);

export const ArrowRightIcon = make(<path d="M5 12h14m0 0-6-6m6 6-6 6" />);

export const ChevronLeftIcon = make(<path d="m15 18-6-6 6-6" />);

export const ChevronRightIcon = make(<path d="m9 18 6-6-6-6" />);

export const FlameIcon = make(
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
);

export const ZapIcon = make(<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />);

export const TargetIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 11.5v1" />
  </>
);

export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </>
);

export const SendIcon = make(<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />);

export const LogoutIcon = make(<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />);

export const AlertIcon = make(
  <>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4m0 4h.01" />
  </>
);

export const RefreshIcon = make(
  <path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" />
);

export const BulbIcon = make(
  <>
    <path d="M9 18h6m-5 4h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
  </>
);

export const GradIcon = make(
  <>
    <path d="M2 8.5 12 4l10 4.5-10 4.5L2 8.5Z" />
    <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v5" />
  </>
);

export const FlaskIcon = make(
  <>
    <path d="M9 3h6M10 3v6.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5V3" />
    <path d="M7.5 15h9" />
  </>
);

export const CalcIcon = make(
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4M16 19h.01" />
  </>
);

export const GlobeIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </>
);

export const LanguageIcon = make(
  <>
    <path d="M4 6h10M9 4v2c0 4-2.5 7-5 8.5M7 10c1.5 3 4 5 6 5.5" />
    <path d="M13 20l4-9 4 9M14.5 17h5" />
  </>
);

export const PlayIcon = make(<path d="M7 4.5v15l12-7.5-12-7.5Z" />);

export const QuoteIcon = make(
  <path d="M10 11H6.5A2.5 2.5 0 0 1 4 8.5V7a3 3 0 0 1 3-3h1m9 7h-3.5A2.5 2.5 0 0 0 14 8.5V7a3 3 0 0 1 3-3h1M10 11v3a5 5 0 0 1-5 5m14-8v3a5 5 0 0 1-5 5" />
);

export const EyeIcon = make(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const EyeOffIcon = make(
  <>
    <path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A16.6 16.6 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </>
);

export const TrophyIcon = make(
  <>
    <path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11" />
  </>
);

export const ShieldIcon = make(
  <>
    <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>
);

export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);

export const FileTextIcon = make(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
    <path d="M14 2v6h6M8 13h8M8 17h5" />
  </>
);

export const ImageIcon = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.5" />
    <path d="m21 15-4.5-4.5L6 21" />
  </>
);
