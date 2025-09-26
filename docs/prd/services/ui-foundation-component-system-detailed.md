# UI Foundation & Component System - 상세 제품 요구사항 문서

## 1. 개요

### 1.1 목적
UI Foundation & Component System은 일관성 있고 접근성 높은 사용자 인터페이스를 구축하기 위한 포괄적인 디자인 시스템과 컴포넌트 라이브러리를 제공합니다.

### 1.2 핵심 목표
- 일관된 디자인 언어 구현
- 재사용 가능한 컴포넌트 라이브러리
- 접근성(A11y) 표준 준수
- 다크 모드 및 테마 지원

## 2. 디자인 시스템

### 2.1 디자인 토큰

#### 2.1.1 토큰 시스템 구조
```typescript
interface DesignTokens {
  // 색상 토큰
  colors: {
    // 기본 팔레트
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    
    // 의미적 색상
    semantic: {
      success: ColorScale;
      warning: ColorScale;
      error: ColorScale;
      info: ColorScale;
    };
    
    // 상태 색상
    state: {
      hover: string;
      active: string;
      disabled: string;
      focus: string;
    };
    
    // 표면 색상
    surface: {
      background: string;
      foreground: string;
      card: string;
      overlay: string;
    };
  };
  
  // 타이포그래피
  typography: {
    fonts: {
      sans: string;
      serif: string;
      mono: string;
    };
    
    sizes: {
      xs: string;   // 12px
      sm: string;   // 14px
      base: string; // 16px
      lg: string;   // 18px
      xl: string;   // 20px
      '2xl': string; // 24px
      '3xl': string; // 30px
      '4xl': string; // 36px
      '5xl': string; // 48px
    };
    
    weights: {
      light: number;    // 300
      regular: number;  // 400
      medium: number;   // 500
      semibold: number; // 600
      bold: number;     // 700
    };
    
    lineHeights: {
      tight: number;    // 1.25
      normal: number;   // 1.5
      relaxed: number;  // 1.75
      loose: number;    // 2
    };
  };
  
  // 간격 시스템
  spacing: {
    0: string;    // 0
    px: string;   // 1px
    0.5: string;  // 2px
    1: string;    // 4px
    2: string;    // 8px
    3: string;    // 12px
    4: string;    // 16px
    5: string;    // 20px
    6: string;    // 24px
    8: string;    // 32px
    10: string;   // 40px
    12: string;   // 48px
    16: string;   // 64px
    20: string;   // 80px
    24: string;   // 96px
  };
  
  // 테두리 반경
  radius: {
    none: string;   // 0
    sm: string;     // 2px
    base: string;   // 4px
    md: string;     // 6px
    lg: string;     // 8px
    xl: string;     // 12px
    '2xl': string;  // 16px
    full: string;   // 9999px
  };
  
  // 그림자
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
  };
  
  // 애니메이션
  animation: {
    duration: {
      fast: string;     // 150ms
      base: string;     // 250ms
      slow: string;     // 350ms
      slower: string;   // 500ms
    };
    
    easing: {
      linear: string;
      in: string;
      out: string;
      inOut: string;
      bounce: string;
    };
  };
  
  // 브레이크포인트
  breakpoints: {
    xs: string;   // 475px
    sm: string;   // 640px
    md: string;   // 768px
    lg: string;   // 1024px
    xl: string;   // 1280px
    '2xl': string; // 1536px
  };
  
  // Z-인덱스
  zIndex: {
    base: number;      // 0
    dropdown: number;  // 1000
    sticky: number;    // 1020
    modal: number;     // 1030
    popover: number;   // 1040
    tooltip: number;   // 1050
    toast: number;     // 1060
  };
}
```

#### 2.1.2 테마 관리
```typescript
class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: string = 'light';
  private customizations: ThemeCustomization = {};
  
  // 테마 등록
  registerTheme(name: string, theme: Theme): void {
    this.themes.set(name, theme);
  }
  
  // 테마 전환
  setTheme(name: string): void {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme "${name}" not found`);
    }
    
    this.currentTheme = name;
    this.applyTheme(theme);
    
    // 로컬 스토리지 저장
    localStorage.setItem('theme', name);
    
    // 이벤트 발생
    this.emit('themeChanged', { theme: name });
  }
  
  // CSS 변수 적용
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // 색상 적용
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([shade, color]) => {
          root.style.setProperty(`--color-${key}-${shade}`, color);
        });
      } else {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
    
    // 타이포그래피 적용
    Object.entries(theme.typography.sizes).forEach(([size, value]) => {
      root.style.setProperty(`--font-size-${size}`, value);
    });
    
    // 간격 적용
    Object.entries(theme.spacing).forEach(([space, value]) => {
      root.style.setProperty(`--spacing-${space}`, value);
    });
  }
  
  // 시스템 테마 감지
  detectSystemTheme(): string {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  // 커스텀 속성 오버라이드
  customize(customization: ThemeCustomization): void {
    this.customizations = { ...this.customizations, ...customization };
    this.applyCustomizations();
  }
}
```

### 2.2 컴포넌트 라이브러리

#### 2.2.1 기본 컴포넌트
```typescript
// Button 컴포넌트
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    const styles = useButtonStyles({ variant, size, loading });
    
    return (
      <button
        ref={ref}
        className={styles}
        disabled={props.disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Spinner size={size} />}
        {props.leftIcon && <span className="icon-left">{props.leftIcon}</span>}
        <span className="button-text">{children}</span>
        {props.rightIcon && <span className="icon-right">{props.rightIcon}</span>}
      </button>
    );
  }
);

// Input 컴포넌트
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, helperText, prefix, suffix, clearable, ...props }, ref) => {
    const [showClear, setShowClear] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    return (
      <div className="input-wrapper">
        {prefix && <div className="input-prefix">{prefix}</div>}
        
        <input
          ref={mergeRefs([ref, inputRef])}
          className={cn('input', { 'input-error': error })}
          aria-invalid={error}
          aria-describedby={helperText ? 'helper-text' : undefined}
          {...props}
        />
        
        {clearable && showClear && (
          <button
            className="input-clear"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = '';
                inputRef.current.focus();
              }
            }}
          >
            <XIcon />
          </button>
        )}
        
        {suffix && <div className="input-suffix">{suffix}</div>}
        
        {helperText && (
          <p id="helper-text" className="helper-text">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
```

#### 2.2.2 복합 컴포넌트
```typescript
// Modal 컴포넌트
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  children: ReactNode;
}

const Modal: FC<ModalProps> & {
  Header: FC<{ children: ReactNode }>;
  Body: FC<{ children: ReactNode }>;
  Footer: FC<{ children: ReactNode }>;
} = ({ isOpen, onClose, ...props }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // ESC 키 처리
  useEffect(() => {
    if (!isOpen || !props.closeOnEsc) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, props.closeOnEsc]);
  
  // 포커스 트랩
  useFocusTrap(modalRef, isOpen);
  
  // 스크롤 잠금
  useScrollLock(isOpen);
  
  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={props.closeOnOverlay ? onClose : undefined}
            />
            
            <motion.div
              ref={modalRef}
              className={cn('modal', `modal-${props.size}`)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={props.title ? 'modal-title' : undefined}
              aria-describedby={props.description ? 'modal-description' : undefined}
            >
              {props.title && (
                <Modal.Header>
                  <h2 id="modal-title">{props.title}</h2>
                  <button
                    className="modal-close"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <XIcon />
                  </button>
                </Modal.Header>
              )}
              
              {props.description && (
                <p id="modal-description" className="modal-description">
                  {props.description}
                </p>
              )}
              
              {props.children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
};

Modal.Header = ({ children }) => <div className="modal-header">{children}</div>;
Modal.Body = ({ children }) => <div className="modal-body">{children}</div>;
Modal.Footer = ({ children }) => <div className="modal-footer">{children}</div>;
```

### 2.3 레이아웃 시스템

#### 2.3.1 Grid 시스템
```typescript
interface GridProps {
  columns?: number | ResponsiveValue<number>;
  gap?: SpacingValue;
  alignItems?: AlignItems;
  justifyContent?: JustifyContent;
  children: ReactNode;
}

const Grid: FC<GridProps> = ({ columns = 12, gap = 4, ...props }) => {
  const styles = useGridStyles({ columns, gap });
  
  return (
    <div className={cn('grid', styles)} {...props}>
      {props.children}
    </div>
  );
};

interface GridItemProps {
  span?: number | ResponsiveValue<number>;
  offset?: number | ResponsiveValue<number>;
  order?: number | ResponsiveValue<number>;
  children: ReactNode;
}

const GridItem: FC<GridItemProps> = ({ span = 1, offset = 0, ...props }) => {
  const styles = useGridItemStyles({ span, offset, order: props.order });
  
  return (
    <div className={cn('grid-item', styles)}>
      {props.children}
    </div>
  );
};

// Flex 레이아웃
interface FlexProps {
  direction?: 'row' | 'column' | ResponsiveValue<'row' | 'column'>;
  wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: SpacingValue;
  align?: AlignItems;
  justify?: JustifyContent;
  children: ReactNode;
}

const Flex: FC<FlexProps> = ({ direction = 'row', ...props }) => {
  const styles = useFlexStyles({ direction, ...props });
  
  return (
    <div className={cn('flex', styles)}>
      {props.children}
    </div>
  );
};
```

### 2.4 접근성

#### 2.4.1 접근성 유틸리티
```typescript
// 스크린 리더 전용 텍스트
const ScreenReaderOnly: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// 키보드 네비게이션
const useKeyboardNavigation = (items: any[], options?: KeyboardNavOptions) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
          
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
          
        case 'End':
          e.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          options?.onSelect?.(items[focusedIndex]);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, options]);
  
  return { focusedIndex, setFocusedIndex };
};

// ARIA Live Region
const LiveRegion: FC<{ message: string; priority?: 'polite' | 'assertive' }> = 
  ({ message, priority = 'polite' }) => (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
```

### 2.5 애니메이션

#### 2.5.1 트랜지션 시스템
```typescript
// 페이드 트랜지션
const FadeTransition: FC<TransitionProps> = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    {...props}
  >
    {children}
  </motion.div>
);

// 슬라이드 트랜지션
const SlideTransition: FC<SlideProps> = ({ direction = 'left', children, ...props }) => {
  const variants = {
    left: { initial: { x: -20 }, animate: { x: 0 } },
    right: { initial: { x: 20 }, animate: { x: 0 } },
    up: { initial: { y: -20 }, animate: { y: 0 } },
    down: { initial: { y: 20 }, animate: { y: 0 } }
  };
  
  return (
    <motion.div
      initial={variants[direction].initial}
      animate={variants[direction].animate}
      exit={variants[direction].initial}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// 스태거 애니메이션
const StaggerChildren: FC<{ children: ReactNode[]; delay?: number }> = 
  ({ children, delay = 0.1 }) => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: delay
          }
        }
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
```

## 3. 성능 최적화

### 3.1 렌더링 최적화
```typescript
// 가상화 리스트
const VirtualList: FC<VirtualListProps> = ({ items, height, itemHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + height) / itemHeight);
    
    return { start, end };
  }, [scrollTop, height, itemHeight]);
  
  const visibleItems = useMemo(() => 
    items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange]
  );
  
  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight }}>
        <div
          style={{
            transform: `translateY(${visibleRange.start * itemHeight}px)`
          }}
        >
          {visibleItems.map((item, index) => 
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
};
```

## 4. 테스트

### 4.1 컴포넌트 테스트
```typescript
describe('Button Component', () => {
  it('renders with correct variant styles', () => {
    const { getByRole } = render(
      <Button variant="primary">Click me</Button>
    );
    
    const button = getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });
  
  it('handles click events', async () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    await userEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    const { getByRole } = render(
      <Button loading>Loading...</Button>
    );
    
    const button = getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });
});
```
