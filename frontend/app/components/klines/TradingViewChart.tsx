import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, Time } from 'lightweight-charts'
import PacmanLoader from '../ui/pacman-loader'
import { formatChartTime, localToUtcTimestamp } from '../../lib/dateTime'

// Mobile detection helper
const isMobileDevice = () => typeof window !== 'undefined' && window.innerWidth < 768

// Mobile price formatter - shorten large numbers
const formatMobilePrice = (price: number): string => {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(2) + 'M'
  }
  if (price >= 10000) {
    return (price / 1000).toFixed(1) + 'K'
  }
  if (price >= 1000) {
    return (price / 1000).toFixed(2) + 'K'
  }
  if (price >= 1) {
    return price.toFixed(2)
  }
  if (price >= 0.01) {
    return price.toFixed(4)
  }
  return price.toFixed(6)
}

function NewsMarkerIcon() {
  return (
    <svg viewBox="0 0 1024 1024" className="h-4 w-4" aria-hidden="true">
      <path d="M891.61 99.61H134.8c-38.61 0-69.91 31.3-69.91 69.91v686.63c0 38.61 31.3 69.91 69.91 69.91h755.86c38.46-0.21 69.53-31.45 69.53-69.91V169.52c0.31-38.22-30.36-69.49-68.58-69.91zM801.65 353.8a6.843 6.843 0 0 0-2.81-4.54l-0.57 0.19a28.429 28.429 0 0 0-11.81-7.24l-25.91-7.43a92.073 92.073 0 0 1-36.57-16.19 42.275 42.275 0 0 1-15.24-32.19c0.13-8.37 2.71-16.52 7.43-23.43a42.253 42.253 0 0 1 19.05-16.19c10-3.67 20.59-5.48 31.24-5.33a66.48 66.48 0 0 1 45.52 13.14 49.519 49.519 0 0 1 16.19 34.67l-31.81 1.33a35.03 35.03 0 0 0-8.76-18.09 34.261 34.261 0 0 0-20.57-5.33c-7.85-0.4-15.64 1.45-22.48 5.33a11.211 11.211 0 0 0-5.33 9.71c0.23 3.66 1.78 7.12 4.38 9.71a83.424 83.424 0 0 0 29.34 10.67 112.25 112.25 0 0 1 34.86 12.57 51.901 51.901 0 0 1 18.09 16.19 47.466 47.466 0 0 1 6.29 25.9c0.06 9.22-2.67 18.25-7.81 25.91a51.607 51.607 0 0 1-21.53 18.1 95.52 95.52 0 0 1-34.67 6.29 66.086 66.086 0 0 1-46.48-14.1 62.856 62.856 0 0 1-19.05-41.14l31.24-2.48a38.133 38.133 0 0 0 11.81 23.43 31.633 31.633 0 0 0 23.43 7.24c8.31 0.73 16.61-1.5 23.43-6.29a19.05 19.05 0 0 0 7.81-15.24 6.808 6.808 0 0 0 1.29-5.17zM188.71 245.83h31.24l65.53 106.68V245.83h30.29v160.39h-32.39l-66.1-105.15v105.15h-28.76l0.19-160.39z m283.06 538.61H182.23V532.61h289.54v251.83zM350.62 406.03v-160.2h119.82v26.86h-87.82v35.62h80.77v26.86h-80.77v44h89.91l0.19 26.86h-122.1z m133.34-160.2h33.33l24.95 110.1L571 245.83h38.1l28.38 112.01 25.33-112.01H695l-39.6 160.39h-34.29l-31.05-120.39-31.81 120.39h-36.19l-38.1-160.39z m357.36 538.23H542.06V733.2h299.26v50.86z m0-100.2H542.06V633h299.26v50.86z m0-100.2H542.06V532.8h299.26v50.86z" fill="currentColor" />
    </svg>
  )
}

function FlowMarkerIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className={`h-4 w-4 ${direction === 'down' ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M325.792041 413.847539c13.659091 4.070712 34.55091 7.463995 53.009308-4.894473 19.48068-13.042037 9.767458-26.707268 5.070482-34.014698l-58.07979 38.909171z m89.650833-113.035426c-18.202571 12.195763-7.722892 26.163893-2.725065 32.915668l54.853306-36.736693c-9.339716-2.904143-32.30987-9.442046-52.128241 3.821025zM175.48985 502.548744c77.924767 41.337477 179.201381 56.837496 274.321786 47.628764l-22.681582-26.953886c-77.151148 5.025457-157.599388-8.572236-220.324988-41.85527-117.284193-62.213947-128.185474-168.897711-24.537859-238.310617 103.712083-69.470211 282.680151-75.320453 399.964344-13.109576 5.457292 2.888793 10.595312 5.910617 15.592117 8.981559v-8.425904c0-9.451256 3.096525-18.122753 8.179286-25.206078-62.179155-31.125905-137.997957-46.635133-213.523071-46.635133-5.904477 0-11.796674 0.350994-17.690918 0.537236l-0.98749 0.028652c-10.208503 0.350994-20.364817 0.977257-30.470989 1.862417-0.437975 0.037862-0.865717 0.079818-1.284249 0.127914-10.080589 0.926092-20.055778 2.105964-29.963429 3.590781-0.396019 0.054235-0.805342 0.124843-1.213641 0.191358-9.969049 1.511423-19.789719 3.26844-29.487592 5.335519-0.258896 0.048095-0.49528 0.10847-0.734734 0.168845-49.862641 10.6782-96.139617 28.480658-133.824914 53.695947l-0.096191 0.057305c-52.958142 35.497469-80.253812 79.323627-82.685187 123.482359-3.25923 56.715723 34.471093 113.980961 111.449301 154.807808z m282.056957-51.312666h140.266627V255.193123c-8.40646-6.019087-17.620309-11.745509-27.720341-17.10968-109.817128-58.06751-276.93224-52.587706-374.119723 12.249999-96.762811 65.054645-86.423325 164.581406 22.969131 222.920092 57.507762 30.350239 130.617873 43.165102 201.212698 39.36045-5.320169-11.294231-5.693676-24.668843-0.466628-36.401048 6.751774-15.171538 21.612227-24.976858 37.858236-24.976858z m-165.54536-11.623735l-15.116279 10.125615c-5.738701 3.840468-7.818059 3.849678-14.601556 0.261966l-2.109034-1.121544-5.53097-2.935865c-6.846942-3.629667-7.067976-4.876054-1.335415-8.713452l15.122419-10.125615c-12.853749-6.815219-58.310034-40.264029-48.223305-47.015803 1.019213-0.689708 1.019213-0.689708 3.763721-1.597381l39.289841-13.099343c0.977257-0.303922 4.569062-0.859577 6.128581-0.041956 2.309602 1.230014 14.566764 23.528879 35.446303 37.379329l65.8825-44.1178c-14.137998-18.368346-46.01808-49.433876-1.671059-79.138408 49.462528-33.126468 112.933095-16.368806 131.116223-7.549953l16.483416-11.042497c5.699816-3.834328 7.894807-3.900843 14.697747-0.28448l7.732102 4.090155c6.715959 3.565199 6.846942 4.876054 1.127683 8.70015l-16.489556 11.042497c10.428513 6.351662 51.670823 37.055964 40.223097 44.724621-1.357927 0.927115-2.76702 1.406023-4.920056 1.901302l-34.606169 9.032724c-2.37714 0.779759-4.565992 0.859577-6.118348 0.028653-2.309602-1.226944-13.44522-23.339568-29.880541-32.05302l-62.204737 41.660842c13.981433 20.330024 41.36306 52.197826-1.699712 81.033571-46.715975 31.30089-103.627149 19.660782-132.506896 8.855692z m104.58394 157.11434c-88.205924 0-173.72874-19.6045-240.83102-55.187926-37.925774-20.125363-68.693522-44.922119-91.317799-72.675206 4.981455 50.529837 42.389436 100.025111 111.047142 136.435368 63.495126 33.704636 142.535297 50.27401 221.092467 50.274011 44.041052 0 87.912236-5.255701 128.831181-15.585977l-41.788755-49.650817c-28.074406 4.185322-57.20384 6.390547-87.033216 6.390547zM64.448848 571.871599c4.974291 50.526767 42.388413 100.021018 111.041002 136.445602 63.502289 33.682124 142.541437 50.2648 221.095537 50.2648 69.473281 0 138.51882-13.013385 196.183148-38.5899l-36.033681-42.800805c-49.075719 14.729469-103.395882 22.531156-160.149467 22.531156-88.205924 0-173.72874-19.6045-240.824881-55.187926-37.925774-20.126386-68.693522-44.920072-91.311658-72.662927z m332.136539 230.849692c-88.205924 0-173.72874-19.60757-240.83102-55.19202-37.925774-20.122293-68.693522-44.909839-91.317799-72.672136 4.981455 50.529837 42.389436 100.025111 111.047142 136.445602 63.495126 33.682124 142.535297 50.27401 221.092467 50.27401 90.685395 0 180.709735-22.094204 245.534136-65.479317l0.134053-0.079818a270.50383 270.50383 0 0 0 9.127892-6.390547l-29.237905-34.743292c-63.859423 31.057343-142.100392 47.837518-225.548966 47.837518z m380.007827-303.217906V236.025575H655.468552v263.47781H473.554386l242.479567 288.047392 242.444774-288.047392H776.593214z" fill="currentColor" />
    </svg>
  )
}

interface TradingViewChartProps {
  symbol: string
  period: string
  exchange?: 'hyperliquid' | 'binance'
  chartType: 'candlestick' | 'line' | 'area'
  selectedIndicators: string[]
  selectedFlowIndicators?: string[]
  onLoadingChange: (loading: boolean) => void
  data?: any[]
  onLoadMore?: () => void
  onDataUpdate?: (klines: any[], indicators: any) => void
  onIndicatorLoadingChange?: (loading: boolean) => void
  showVolumePane?: boolean
  eventMarkers?: Array<{
    id?: string
    kind?: 'news' | 'flow'
    time: number
    position: 'aboveBar' | 'belowBar'
    color: string
    shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown'
    text?: string
    title?: string
    summary?: string
    tone?: 'bullish' | 'bearish' | 'mixed'
    metadata?: string[]
    iconVariant?: 'news' | 'flow-up' | 'flow-down'
  }>
  activeEventMarkerId?: string
  onEventMarkerClick?: (eventId: string) => void
  incrementalRefreshToken?: number
}

type ChartType = 'candlestick' | 'line' | 'area'

export default function TradingViewChart({
  symbol,
  period,
  exchange = 'hyperliquid',
  chartType,
  selectedIndicators,
  selectedFlowIndicators = [],
  onLoadingChange,
  data = [],
  onLoadMore,
  onDataUpdate,
  onIndicatorLoadingChange,
  showVolumePane = true,
  eventMarkers = [],
  activeEventMarkerId,
  onEventMarkerClick,
  incrementalRefreshToken = 0,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const ma5SeriesRef = useRef<any>(null)
  const ma10SeriesRef = useRef<any>(null)
  const ma20SeriesRef = useRef<any>(null)
  const ema20SeriesRef = useRef<any>(null)
  const ema50SeriesRef = useRef<any>(null)
  const ema100SeriesRef = useRef<any>(null)
  const vwapSeriesRef = useRef<any>(null)
  const bollUpperSeriesRef = useRef<any>(null)
  const bollMiddleSeriesRef = useRef<any>(null)
  const bollLowerSeriesRef = useRef<any>(null)
  const rsiSeriesRef = useRef<any>(null)
  const macdSeriesRef = useRef<any>(null)
  const atrSeriesRef = useRef<any>(null)
  const stochSeriesRef = useRef<any>(null)
  const obvSeriesRef = useRef<any>(null)
  // Market Flow refs - all series pre-created in flow pane
  const flowPaneRef = useRef<any>(null)
  const flowLabelRef = useRef<any>(null)
  const flowCvdSeriesRef = useRef<any>(null)
  const flowTakerBuySeriesRef = useRef<any>(null)
  const flowTakerSellSeriesRef = useRef<any>(null)
  const flowOiSeriesRef = useRef<any>(null)
  const flowOiDeltaSeriesRef = useRef<any>(null)
  const flowFundingSeriesRef = useRef<any>(null)
  const flowDepthSeriesRef = useRef<any>(null)
  const flowImbalanceSeriesRef = useRef<any>(null)
  const [activeFlowIndicator, setActiveFlowIndicator] = useState<string | null>(null)
  const [flowDataCache, setFlowDataCache] = useState<Record<string, any[]>>({})
  const [flowDataAvailableFrom, setFlowDataAvailableFrom] = useState<number | null>(null)
  const prevFlowIndicatorsRef = useRef<string[]>([])
  const [loading, setLoading] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [indicatorData, setIndicatorData] = useState<any>({})
  const [cachedIndicators, setCachedIndicators] = useState<string[]>([])
  const [activeSubplot, setActiveSubplot] = useState<string | null>(null)
  const indicatorPaneRef = useRef<any>(null)
  const indicatorLabelRef = useRef<any>(null)
  const prevIndicatorsRef = useRef<string[]>([])
  const prevSubplotIndicatorsRef = useRef<string[]>([])
  // Pane position tracking for selector placement
  const [indicatorPaneTop, setIndicatorPaneTop] = useState<number | null>(null)
  const [flowPaneTop, setFlowPaneTop] = useState<number | null>(null)
  const [hoveredMarker, setHoveredMarker] = useState<{
    x: number
    y: number
    marker: any
  } | null>(null)
  const [hoveredCandleTime, setHoveredCandleTime] = useState<number | null>(null)
  const [hoveredMarkerCandleTime, setHoveredMarkerCandleTime] = useState<number | null>(null)
  const [overlayMarkers, setOverlayMarkers] = useState<Array<{
    key: string
    x: number
    y: number
    marker: any
  }>>([])
  const [viewportVersion, setViewportVersion] = useState(0)
  const lastIncrementalRefreshRef = useRef(0)

  // Market Flow indicator colors
  const FLOW_COLORS: Record<string, { up: string; down: string; line: string }> = {
    cvd: { up: '#22c55e', down: '#ef4444', line: '#3b82f6' },
    taker_volume: { up: '#22c55e', down: '#ef4444', line: '#3b82f6' },
    oi: { up: '#22c55e', down: '#ef4444', line: '#8b5cf6' },
    oi_delta: { up: '#22c55e', down: '#ef4444', line: '#8b5cf6' },
    funding: { up: '#22c55e', down: '#ef4444', line: '#f59e0b' },
    depth_ratio: { up: '#22c55e', down: '#ef4444', line: '#06b6d4' },
    order_imbalance: { up: '#22c55e', down: '#ef4444', line: '#ec4899' }
  }

  const FLOW_LABELS: Record<string, string> = {
    cvd: 'CVD',
    taker_volume: 'Taker Volume',
    oi: 'Open Interest',
    oi_delta: 'OI Delta',
    funding: 'Funding Rate (bps)',
    depth_ratio: 'Depth Ratio (log)',
    order_imbalance: 'Order Imbalance'
  }

  const bumpViewportVersion = () => setViewportVersion(v => v + 1)

  // 检测是否需要重新初始化图表（子图结构变化）
  const needsChartReinit = (prevIndicators: string[], newIndicators: string[]) => {
    const subplotIndicators = ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV']
    const prevSubplots = prevIndicators.filter(ind => subplotIndicators.includes(ind))
    const newSubplots = newIndicators.filter(ind => subplotIndicators.includes(ind))

    // 子图指标从无到有，或从有到无，需要重新初始化
    return (prevSubplots.length === 0) !== (newSubplots.length === 0)
  }

  // Calculate pane positions for selector placement
  const updatePanePositions = () => {
    if (!chartRef.current || !chartContainerRef.current) return
    const panes = chartRef.current.panes()
    const totalHeight = chartContainerRef.current.clientHeight
    let totalStretch = 0
    const stretchFactors: number[] = []
    for (const pane of panes) {
      const factor = pane.getStretchFactor?.() || 1
      stretchFactors.push(factor)
      totalStretch += factor
    }
    // Calculate cumulative top positions
    let currentTop = 0
    const panePositions: number[] = []
    for (let i = 0; i < panes.length; i++) {
      panePositions.push(currentTop)
      currentTop += (stretchFactors[i] / totalStretch) * totalHeight
    }
    // Update indicator pane position (pane index 2 if exists)
    if (indicatorPaneRef.current && panes.length > 2) {
      const idx = panes.indexOf(indicatorPaneRef.current)
      if (idx >= 0) setIndicatorPaneTop(panePositions[idx])
    } else {
      setIndicatorPaneTop(null)
    }
    // Update flow pane position
    if (flowPaneRef.current) {
      const idx = panes.indexOf(flowPaneRef.current)
      if (idx >= 0) setFlowPaneTop(panePositions[idx])
    } else {
      setFlowPaneTop(null)
    }
  }

  // 创建 pane 标签的 primitive
  const createPaneLabel = (text: string) => ({
    paneViews() {
      return [{
        renderer() {
          return {
            draw(target: any) {
              target.useMediaCoordinateSpace((scope: any) => {
                const ctx = scope.context
                ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                ctx.fillStyle = 'rgba(156, 163, 175, 0.6)'
                ctx.textAlign = 'left'
                ctx.textBaseline = 'top'
                ctx.fillText(text, 8, 8)
              })
            }
          }
        }
      }]
    }
  })

  // 创建主图表系列
  const createMainSeries = (chart: any, type: ChartType) => {
    switch (type) {
      case 'candlestick':
        return chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        })
      case 'line':
        return chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
        })
      case 'area':
        return chart.addSeries(AreaSeries, {
          topColor: '#3b82f640',
          bottomColor: '#3b82f610',
          lineColor: '#3b82f6',
          lineWidth: 2,
        })
      default:
        return chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        })
    }
  }

  // 转换数据格式
  const convertDataForSeries = (data: any[], type: ChartType) => {
    switch (type) {
      case 'candlestick':
        return data.map(item => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))
      case 'line':
      case 'area':
        return data.map(item => ({
          time: item.time,
          value: item.close,
        }))
      default:
        return data
    }
  }

  // 计算移动平均线
  const calculateMA = (data: any[], period: number) => {
    const result = []
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0)
      result.push({
        time: data[i].time,
        value: sum / period,
      })
    }
    return result
  }


  // 图表初始化 - 只在chartType变化时重新初始化
  useEffect(() => {
    if (!chartContainerRef.current) return

    try {
      const container = chartContainerRef.current

      // 判断是否需要指标子图
      const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
      const needsSubplot = subplotIndicators.length > 0
      const isMobile = isMobileDevice()

      // 创建图表 - 使用正确的Panel架构
      const chart = createChart(container, {
        width: container.clientWidth,
        height: Math.max(container.clientHeight || 300, 300),
        layout: {
          background: { color: 'transparent' },
          textColor: '#9ca3af',
          attributionLogo: false,
        },
        localization: {
          locale: 'en-US',
        },
        grid: {
          vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
          horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: 'rgba(156, 163, 175, 0.5)',
            style: 0,
          },
          horzLine: {
            width: 1,
            color: 'rgba(156, 163, 175, 0.5)',
            style: 0,
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(156, 163, 175, 0.2)',
          minimumWidth: isMobile ? 50 : 80,
          scaleMargins: isMobile ? { top: 0.1, bottom: 0.1 } : { top: 0.05, bottom: 0.05 },
          tickMarkFormatter: isMobile ? formatMobilePrice : undefined,
        },
        timeScale: {
          borderColor: 'rgba(156, 163, 175, 0.2)',
          timeVisible: true,
          secondsVisible: false,
          barSpacing: isMobile ? 6 : 9,
          rightBarStaysOnScroll: false,
        },
      })

      const volumePane = showVolumePane ? chart.addPane() : null
      if (volumePane) {
        volumePane.attachPrimitive(createPaneLabel('Volume'))
      }

      // 创建指标Panel（如果需要）
      let indicatorPane = null
      if (needsSubplot) {
        indicatorPane = chart.addPane()
        indicatorPaneRef.current = indicatorPane
        // 创建并附加标签 primitive
        const labelPrimitive = createPaneLabel('Indicators')
        indicatorPane.attachPrimitive(labelPrimitive)
        indicatorLabelRef.current = labelPrimitive
      }

      // 设置Panel高度比例
      if (needsSubplot && volumePane) {
        // 三层布局：主图60% + Volume20% + 指标20%
        chart.panes()[0].setStretchFactor(3)  // 主图 60% (3/5)
        volumePane.setStretchFactor(1)        // Volume 20% (1/5)
        indicatorPane.setStretchFactor(1)     // 指标 20% (1/5)
      } else if (needsSubplot && !volumePane) {
        chart.panes()[0].setStretchFactor(4)
        indicatorPane.setStretchFactor(1)
      } else {
        chart.panes()[0].setStretchFactor(1)
      }

      // 在主Panel创建主图表系列
      const mainSeries = createMainSeries(chart, chartType)

      // 在Volume Panel创建成交量系列
      const volumeSeries = volumePane ? volumePane.addSeries(HistogramSeries, {
        color: '#6b7280',
        priceFormat: {
          type: 'volume',
        },
      }) : null


      // 创建移动平均线系列
      const ma5Series = chart.addSeries(LineSeries, {
        color: '#ff6b6b',
        lineWidth: 1,
        visible: false,
      })

      const ma10Series = chart.addSeries(LineSeries, {
        color: '#4ecdc4',
        lineWidth: 1,
        visible: false,
      })

      const ma20Series = chart.addSeries(LineSeries, {
        color: '#45b7d1',
        lineWidth: 1,
        visible: false,
      })

      // EMA指标系列
      const ema20Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        visible: false,
      })

      const ema50Series = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        visible: false,
      })

      const ema100Series = chart.addSeries(LineSeries, {
        color: '#ec4899',
        lineWidth: 2,
        visible: false,
      })

      const vwapSeries = chart.addSeries(LineSeries, {
        color: '#14b8a6',
        lineWidth: 2,
        visible: false,
      })

      // 创建BOLL布林带系列
      const bollUpperSeries = chart.addSeries(LineSeries, {
        color: '#9333ea',
        lineWidth: 1,
        visible: false,
      })

      const bollMiddleSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 1,
        visible: false,
      })

      const bollLowerSeries = chart.addSeries(LineSeries, {
        color: '#9333ea',
        lineWidth: 1,
        visible: false,
      })

      // 创建指标系列（在指标Panel中）
      let rsiSeries = null
      let macdSeries = null
      let atrSeries = null
      let stochSeries = null
      let obvSeries = null

      if (indicatorPane) {
        rsiSeries = indicatorPane.addSeries(LineSeries, {
          color: '#e11d48',
          lineWidth: 2,
          visible: false,
        })

        // MACD需要多个系列
        const macdLine = indicatorPane.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          visible: false,
        })
        const signalLine = indicatorPane.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 1,
          visible: false,
        })
        const histogram = indicatorPane.addSeries(HistogramSeries, {
          color: '#6b7280',
          visible: false,
        })
        macdSeries = { macdLine, signalLine, histogram }

        atrSeries = indicatorPane.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 2,
          visible: false,
        })

        // Stochastic需要两条线（%K和%D）
        const stochK = indicatorPane.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          visible: false,
        })
        const stochD = indicatorPane.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 1,
          visible: false,
        })
        stochSeries = { stochK, stochD }

        obvSeries = indicatorPane.addSeries(LineSeries, {
          color: '#10b981',
          lineWidth: 2,
          visible: false,
        })
      }

      chartRef.current = chart
      seriesRef.current = mainSeries
      volumeSeriesRef.current = volumeSeries
      ma5SeriesRef.current = ma5Series
      ma10SeriesRef.current = ma10Series
      ma20SeriesRef.current = ma20Series
      ema20SeriesRef.current = ema20Series
      ema50SeriesRef.current = ema50Series
      ema100SeriesRef.current = ema100Series
      vwapSeriesRef.current = vwapSeries
      bollUpperSeriesRef.current = bollUpperSeries
      bollMiddleSeriesRef.current = bollMiddleSeries
      bollLowerSeriesRef.current = bollLowerSeries
      rsiSeriesRef.current = rsiSeries
      macdSeriesRef.current = macdSeries
      atrSeriesRef.current = atrSeries
      stochSeriesRef.current = stochSeries
      obvSeriesRef.current = obvSeries
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        bumpViewportVersion()
      })
      chart.subscribeCrosshairMove((param: any) => {
        const time = typeof param?.time === 'number' ? param.time : null
        setHoveredCandleTime(time)
      })
      // 监听容器大小变化
      let resizeTimeout: NodeJS.Timeout
      const resizeObserver = new ResizeObserver(entries => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (chartRef.current && width > 0 && height > 0) {
              chartRef.current.applyOptions({ width, height })
              updatePanePositions()
              bumpViewportVersion()
            }
          }
        }, 100)
      })
      resizeObserver.observe(container)

      // Initial pane position calculation
      setTimeout(() => {
        updatePanePositions()
        bumpViewportVersion()
      }, 50)

      return () => {
        clearTimeout(resizeTimeout)
        resizeObserver.disconnect()
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          seriesRef.current = null
          volumeSeriesRef.current = null
          ma5SeriesRef.current = null
          ma10SeriesRef.current = null
          ma20SeriesRef.current = null
          ema20SeriesRef.current = null
          ema50SeriesRef.current = null
          ema100SeriesRef.current = null
          vwapSeriesRef.current = null
          bollUpperSeriesRef.current = null
          bollMiddleSeriesRef.current = null
          bollLowerSeriesRef.current = null
          rsiSeriesRef.current = null
          macdSeriesRef.current = null
          atrSeriesRef.current = null
          stochSeriesRef.current = null
          obvSeriesRef.current = null
          indicatorPaneRef.current = null
          indicatorLabelRef.current = null
          // Clean up flow refs
          flowPaneRef.current = null
          flowLabelRef.current = null
          flowCvdSeriesRef.current = null
          flowTakerBuySeriesRef.current = null
          flowTakerSellSeriesRef.current = null
          flowOiSeriesRef.current = null
          flowOiDeltaSeriesRef.current = null
          flowFundingSeriesRef.current = null
          flowDepthSeriesRef.current = null
          flowImbalanceSeriesRef.current = null
        }
      }
    } catch (error) {
      console.error('Chart initialization failed:', error)
    }
  }, [chartType, showVolumePane])

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !chartData.length || !chartContainerRef.current) {
      setOverlayMarkers([])
      return
    }

    const findNearestPoint = (chartTime: number) => {
      let best = chartData[0]
      let bestDiff = Math.abs(chartData[0].time - chartTime)
      for (let i = 1; i < chartData.length; i += 1) {
        const diff = Math.abs(chartData[i].time - chartTime)
        if (diff < bestDiff) {
          best = chartData[i]
          bestDiff = diff
        }
      }
      return best
    }

    const nextMarkers: Array<{ key: string; x: number; y: number; marker: any }> = []
    const grouped = new Map<string, Array<{ marker: any; candle: any; position: string }>>()

    for (const marker of eventMarkers) {
      const chartTime = formatChartTime(marker.time / 1000) as number
      const candle = findNearestPoint(chartTime)
      const key = `${candle.time}:${marker.position}`
      const existing = grouped.get(key) || []
      existing.push({ marker, candle, position: marker.position })
      grouped.set(key, existing)
    }

    grouped.forEach((entries, groupKey) => {
      const [candleTimeRaw] = groupKey.split(':')
      const candle = entries[0]?.candle
      if (!candle) return
      const x = chartRef.current.timeScale().timeToCoordinate(candle.time as Time)
      if (x === null || x === undefined) return
      const containerWidth = chartContainerRef.current?.clientWidth || 0
      const containerHeight = chartContainerRef.current?.clientHeight || 0
      const safeLeft = 16
      const safeRight = Math.max(safeLeft + 1, containerWidth - 92)
      if (x < safeLeft) return

      const sorted = [...entries].sort((a, b) => a.marker.time - b.marker.time)
      sorted.forEach(({ marker }, index) => {
        const row = index % 3
        const column = Math.floor(index / 3)
        const xOffset = column === 0 ? 0 : (column % 2 === 1 ? column * 7 : -column * 7)
        const baseY = seriesRef.current.priceToCoordinate(candle.low)
        if (baseY === null || baseY === undefined) return
        const y = Math.min(baseY + 22 + row * 12, Math.max(48, containerHeight - 36))
        nextMarkers.push({
          key: marker.id || `${marker.kind || 'event'}-${marker.time}-${index}`,
          x: Math.min(Math.max(x + xOffset, safeLeft), safeRight),
          y,
          marker: {
            ...marker,
            chartTime: Number(candleTimeRaw),
          },
        })
      })
    })

    setOverlayMarkers(nextMarkers)
  }, [chartData, eventMarkers, viewportVersion])

  useEffect(() => {
    if (!activeEventMarkerId || !overlayMarkers.length) return

    const activeMarker = overlayMarkers.find(item => item.marker.id === activeEventMarkerId)
    if (!activeMarker) return

    setHoveredMarker({
      x: activeMarker.x,
      y: activeMarker.y,
      marker: activeMarker.marker,
    })
  }, [activeEventMarkerId, overlayMarkers])

  // 动态管理子图Pane - 只在子图结构变化时重新初始化
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return

    const shouldReinit = needsChartReinit(prevIndicatorsRef.current, selectedIndicators)

    if (shouldReinit) {
      // 需要重新初始化图表结构
      const container = chartContainerRef.current
      const currentChartData = chartData
      const currentIndicatorData = indicatorData

      // 在重建前设置正确的activeSubplot，避免状态滞后
      const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
      if (subplotIndicators.length > 0 && !activeSubplot) {
        setActiveSubplot(subplotIndicators[0])
      }

      // 保存当前数据，重新初始化图表
      if (chartRef.current) {
        chartRef.current.remove()
        // Clear flow pane refs since chart is destroyed - they will be recreated
        flowPaneRef.current = null
        flowLabelRef.current = null
        flowCvdSeriesRef.current = null
        flowTakerBuySeriesRef.current = null
        flowTakerSellSeriesRef.current = null
        flowOiSeriesRef.current = null
        flowOiDeltaSeriesRef.current = null
        flowFundingSeriesRef.current = null
        flowDepthSeriesRef.current = null
        flowImbalanceSeriesRef.current = null
      }

      try {
        // 判断是否需要指标子图
        const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
        const needsSubplot = subplotIndicators.length > 0
        const isMobile = isMobileDevice()

        // 创建图表 - 使用正确的Panel架构
        const chart = createChart(container, {
          width: container.clientWidth,
          height: Math.max(container.clientHeight || 300, 300),
          layout: {
            background: { color: 'transparent' },
            textColor: '#9ca3af',
            attributionLogo: false,
          },
          localization: {
            locale: 'en-US',
          },
          grid: {
            vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
            horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              width: 1,
              color: 'rgba(156, 163, 175, 0.5)',
              style: 0,
            },
            horzLine: {
              width: 1,
              color: 'rgba(156, 163, 175, 0.5)',
              style: 0,
            },
          },
          rightPriceScale: {
            borderColor: 'rgba(156, 163, 175, 0.2)',
            minimumWidth: isMobile ? 50 : 80,
            scaleMargins: isMobile ? { top: 0.1, bottom: 0.1 } : { top: 0.05, bottom: 0.05 },
          },
          timeScale: {
            borderColor: 'rgba(156, 163, 175, 0.2)',
            timeVisible: true,
            secondsVisible: false,
            barSpacing: isMobile ? 6 : 9,
            rightBarStaysOnScroll: false,
          },
        })

        const volumePane = showVolumePane ? chart.addPane() : null
        if (volumePane) {
          volumePane.attachPrimitive(createPaneLabel('Volume'))
        }

        // 创建指标Panel（如果需要）
        let indicatorPane = null
        if (needsSubplot) {
          indicatorPane = chart.addPane()
          indicatorPaneRef.current = indicatorPane
          const labelPrimitive = createPaneLabel('Indicators')
          indicatorPane.attachPrimitive(labelPrimitive)
          indicatorLabelRef.current = labelPrimitive
        }

        // 设置Panel高度比例
        if (needsSubplot && volumePane) {
          chart.panes()[0].setStretchFactor(3)
          volumePane.setStretchFactor(1)
          indicatorPane.setStretchFactor(1)
        } else if (needsSubplot && !volumePane) {
          chart.panes()[0].setStretchFactor(4)
          indicatorPane.setStretchFactor(1)
        } else {
          chart.panes()[0].setStretchFactor(1)
        }

        // 重新创建所有系列
        const mainSeries = createMainSeries(chart, chartType)
        const volumeSeries = volumePane ? volumePane.addSeries(HistogramSeries, {
          color: '#6b7280',
          priceFormat: { type: 'volume' },
        }) : null

        // 创建移动平均线系列
        const ma5Series = chart.addSeries(LineSeries, { color: '#ff6b6b', lineWidth: 1, visible: false })
        const ma10Series = chart.addSeries(LineSeries, { color: '#4ecdc4', lineWidth: 1, visible: false })
        const ma20Series = chart.addSeries(LineSeries, { color: '#45b7d1', lineWidth: 1, visible: false })
        const ema20Series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2, visible: false })
        const ema50Series = chart.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 2, visible: false })
        const ema100Series = chart.addSeries(LineSeries, { color: '#ec4899', lineWidth: 2, visible: false })
        const vwapSeries = chart.addSeries(LineSeries, { color: '#14b8a6', lineWidth: 2, visible: false })
        const bollUpperSeries = chart.addSeries(LineSeries, { color: '#9333ea', lineWidth: 1, visible: false })
        const bollMiddleSeries = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, visible: false })
        const bollLowerSeries = chart.addSeries(LineSeries, { color: '#9333ea', lineWidth: 1, visible: false })

        // 创建指标系列（在指标Panel中）
        let rsiSeries = null
        let macdSeries = null
        let atrSeries = null
        let stochSeries = null
        let obvSeries = null

        if (indicatorPane) {
          rsiSeries = indicatorPane.addSeries(LineSeries, { color: '#e11d48', lineWidth: 2, visible: false })
          const macdLine = indicatorPane.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, visible: false })
          const signalLine = indicatorPane.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, visible: false })
          const histogram = indicatorPane.addSeries(HistogramSeries, { color: '#6b7280', visible: false })
          macdSeries = { macdLine, signalLine, histogram }
          atrSeries = indicatorPane.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 2, visible: false })
          const stochK = indicatorPane.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, visible: false })
          const stochD = indicatorPane.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, visible: false })
          stochSeries = { stochK, stochD }
          obvSeries = indicatorPane.addSeries(LineSeries, { color: '#10b981', lineWidth: 2, visible: false })
        }

        // 更新所有引用
        chartRef.current = chart
        seriesRef.current = mainSeries
        volumeSeriesRef.current = volumeSeries
        ma5SeriesRef.current = ma5Series
        ma10SeriesRef.current = ma10Series
        ma20SeriesRef.current = ma20Series
        ema20SeriesRef.current = ema20Series
        ema50SeriesRef.current = ema50Series
        ema100SeriesRef.current = ema100Series
        vwapSeriesRef.current = vwapSeries
        bollUpperSeriesRef.current = bollUpperSeries
        bollMiddleSeriesRef.current = bollMiddleSeries
        bollLowerSeriesRef.current = bollLowerSeries
        rsiSeriesRef.current = rsiSeries
        macdSeriesRef.current = macdSeries
        atrSeriesRef.current = atrSeries
        stochSeriesRef.current = stochSeries
        obvSeriesRef.current = obvSeries
        chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          bumpViewportVersion()
        })
        // 重新应用数据
        const resolvedActiveSubplot = (activeSubplot && subplotIndicators.includes(activeSubplot))
          ? activeSubplot
          : subplotIndicators[0]

        if (currentChartData.length > 0) {
          const mainData = convertDataForSeries(currentChartData, chartType)
          const volumeData = currentChartData.map(item => ({
            time: item.time,
            value: item.volume || 0,
            color: item.close >= item.open ? '#22c55e' : '#ef4444',
          }))

          mainSeries.setData(mainData)
          if (volumeSeries) volumeSeries.setData(volumeData)

          // 重新应用移动平均线数据
          const ma5Data = calculateMA(currentChartData, 5)
          const ma10Data = calculateMA(currentChartData, 10)
          const ma20Data = calculateMA(currentChartData, 20)
          ma5Series.setData(ma5Data)
          ma10Series.setData(ma10Data)
          ma20Series.setData(ma20Data)

          // 重新应用指标数据
          if (currentIndicatorData.EMA20 && ema20Series) {
            const ema20Data = currentIndicatorData.EMA20.map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && item.value > 0)
            ema20Series.setData(ema20Data)
          }

          if (currentIndicatorData.EMA50 && ema50Series) {
            const ema50Data = currentIndicatorData.EMA50.map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && item.value > 0)
            ema50Series.setData(ema50Data)
          }

          if (currentIndicatorData.EMA100 && ema100SeriesRef.current) {
            const ema100Data = currentIndicatorData.EMA100.map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && item.value > 0)
            ema100SeriesRef.current.setData(ema100Data)
          }

          if (currentIndicatorData.VWAP && vwapSeriesRef.current) {
            const vwapData = currentIndicatorData.VWAP.map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && !isNaN(item.value) && item.value !== null)
            vwapSeriesRef.current.setData(vwapData)
          }

          // 重新应用BOLL数据
          if (currentIndicatorData.BOLL) {
            const bollData = currentIndicatorData.BOLL
            if (bollData.upper && bollUpperSeries) {
              const upperData = bollData.upper.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              bollUpperSeries.setData(upperData)
            }
            if (bollData.middle && bollMiddleSeries) {
              const middleData = bollData.middle.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              bollMiddleSeries.setData(middleData)
            }
            if (bollData.lower && bollLowerSeries) {
              const lowerData = bollData.lower.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              bollLowerSeries.setData(lowerData)
            }
          }

          // 重新应用RSI数据 - 应用所有可用的RSI数据
          if (rsiSeries) {
            const rsiSource = resolvedActiveSubplot === 'RSI7' ? currentIndicatorData.RSI7 : currentIndicatorData.RSI14 || currentIndicatorData.RSI7
            const rsiData = (rsiSource || []).map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && !isNaN(item.value) && item.value > 0)
            rsiSeries.setData(rsiData)
          }

          // 重新应用MACD数据 - 无条件应用如果数据存在
          if (currentIndicatorData.MACD && macdSeries) {
            const macdData = currentIndicatorData.MACD
            if (macdData.macd && macdSeries.macdLine) {
              const macdLineData = macdData.macd.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              macdSeries.macdLine.setData(macdLineData)
            }
            if (macdData.signal && macdSeries.signalLine) {
              const signalData = macdData.signal.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              macdSeries.signalLine.setData(signalData)
            }
            if (macdData.histogram && macdSeries.histogram) {
              const histogramData = macdData.histogram.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value,
                color: value >= 0 ? '#22c55e' : '#ef4444'
              })).filter((item: any) => item.time && !isNaN(item.value))
              macdSeries.histogram.setData(histogramData)
            }
          }

          // 重新应用ATR数据 - 无条件应用如果数据存在
          if (currentIndicatorData.ATR14 && atrSeries) {
            const atrData = currentIndicatorData.ATR14.map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && !isNaN(item.value))
            atrSeries.setData(atrData)
          }

          // 重新应用STOCH数据
          if (currentIndicatorData.STOCH && stochSeriesRef.current) {
            const stochData = currentIndicatorData.STOCH
            if (stochData.k && stochSeriesRef.current.stochK) {
              const kData = stochData.k.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              stochSeriesRef.current.stochK.setData(kData)
            }
            if (stochData.d && stochSeriesRef.current.stochD) {
              const dData = stochData.d.map((value: number, index: number) => ({
                time: currentChartData[index]?.time,
                value: value
              })).filter((item: any) => item.time && !isNaN(item.value))
              stochSeriesRef.current.stochD.setData(dData)
            }
          }

          // 重新应用OBV数据
          if (currentIndicatorData.OBV && obvSeriesRef.current) {
            const obvData = currentIndicatorData.OBV.map((value: number, index: number) => ({
              time: currentChartData[index]?.time,
              value: value
            })).filter((item: any) => item.time && !isNaN(item.value))
            obvSeriesRef.current.setData(obvData)
          }
        }

        // 重新应用指标显示状态
        setTimeout(() => {
          const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
          const resolvedActiveSubplot = (activeSubplot && subplotIndicators.includes(activeSubplot))
            ? activeSubplot
            : subplotIndicators[0]

          // 主图指标显示状态
          if (ma5Series) ma5Series.applyOptions({ visible: selectedIndicators.includes('MA5') })
          if (ma10Series) ma10Series.applyOptions({ visible: selectedIndicators.includes('MA10') })
          if (ma20Series) ma20Series.applyOptions({ visible: selectedIndicators.includes('MA20') })
          if (ema20Series) ema20Series.applyOptions({ visible: selectedIndicators.includes('EMA20') })
          if (ema50Series) ema50Series.applyOptions({ visible: selectedIndicators.includes('EMA50') })
          if (ema100SeriesRef.current) ema100SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('EMA100') })
          if (vwapSeriesRef.current) vwapSeriesRef.current.applyOptions({ visible: selectedIndicators.includes('VWAP') })

          const showBoll = selectedIndicators.includes('BOLL')
          if (bollUpperSeries) bollUpperSeries.applyOptions({ visible: showBoll })
          if (bollMiddleSeries) bollMiddleSeries.applyOptions({ visible: showBoll })
          if (bollLowerSeries) bollLowerSeries.applyOptions({ visible: showBoll })

          // 子图指标显示状态
          if (rsiSeries) {
            const showRSI = (resolvedActiveSubplot === 'RSI14' || resolvedActiveSubplot === 'RSI7') && selectedIndicators.includes(resolvedActiveSubplot)
            rsiSeries.applyOptions({ visible: showRSI })
          }

          if (macdSeries) {
            const showMACD = resolvedActiveSubplot === 'MACD' && selectedIndicators.includes('MACD')
            if (macdSeries.macdLine) macdSeries.macdLine.applyOptions({ visible: showMACD })
            if (macdSeries.signalLine) macdSeries.signalLine.applyOptions({ visible: showMACD })
            if (macdSeries.histogram) macdSeries.histogram.applyOptions({ visible: showMACD })
          }

          if (atrSeries) {
            const showATR = resolvedActiveSubplot === 'ATR14' && selectedIndicators.includes('ATR14')
            atrSeries.applyOptions({ visible: showATR })
          }

          if (stochSeriesRef.current) {
            const showSTOCH = resolvedActiveSubplot === 'STOCH' && selectedIndicators.includes('STOCH')
            if (stochSeriesRef.current.stochK) stochSeriesRef.current.stochK.applyOptions({ visible: showSTOCH })
            if (stochSeriesRef.current.stochD) stochSeriesRef.current.stochD.applyOptions({ visible: showSTOCH })
          }

          if (obvSeriesRef.current) {
            const showOBV = resolvedActiveSubplot === 'OBV' && selectedIndicators.includes('OBV')
            obvSeriesRef.current.applyOptions({ visible: showOBV })
          }

          // Recreate flow pane if there are selected flow indicators
          if (selectedFlowIndicators.length > 0 && chartRef.current && !flowPaneRef.current) {
            const flowPane = chartRef.current.addPane()
            flowPane.setStretchFactor(1)
            const labelPrimitive = createPaneLabel('Market Flow')
            flowPane.attachPrimitive(labelPrimitive)
            flowLabelRef.current = labelPrimitive
            flowPaneRef.current = flowPane

            // Pre-create all flow series
            flowCvdSeriesRef.current = flowPane.addSeries(LineSeries, {
              color: FLOW_COLORS.cvd.line, lineWidth: 2, visible: false,
              priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
            })
            flowTakerBuySeriesRef.current = flowPane.addSeries(HistogramSeries, {
              color: FLOW_COLORS.taker_volume.up, visible: false,
              priceFormat: { type: 'volume' }
            })
            flowTakerSellSeriesRef.current = flowPane.addSeries(HistogramSeries, {
              color: FLOW_COLORS.taker_volume.down, visible: false,
              priceFormat: { type: 'volume' }
            })
            flowOiSeriesRef.current = flowPane.addSeries(LineSeries, {
              color: FLOW_COLORS.oi.line, lineWidth: 2, visible: false,
              priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
            })
            flowOiDeltaSeriesRef.current = flowPane.addSeries(HistogramSeries, {
              color: FLOW_COLORS.oi_delta.line, visible: false,
              priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
            })
            flowFundingSeriesRef.current = flowPane.addSeries(LineSeries, {
              color: FLOW_COLORS.funding.line, lineWidth: 2, visible: false,
              priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
            })
            flowDepthSeriesRef.current = flowPane.addSeries(LineSeries, {
              color: FLOW_COLORS.depth_ratio.line, lineWidth: 2, visible: false,
              priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
            })
            flowImbalanceSeriesRef.current = flowPane.addSeries(HistogramSeries, {
              color: FLOW_COLORS.order_imbalance.line, visible: false,
              priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
            })

            // Show active indicator and fetch data
            if (activeFlowIndicator) {
              showFlowSeries(activeFlowIndicator)
              updateFlowPaneLabel(activeFlowIndicator)
              if (flowDataCache[activeFlowIndicator]) {
                updateFlowSeries(activeFlowIndicator, flowDataCache[activeFlowIndicator])
              } else {
                fetchFlowData(activeFlowIndicator)
              }
            }
            // Update pane positions after flow pane created
            updatePanePositions()
          }
        }, 0)
      } catch (error) {
        console.error('Chart reinitialization failed:', error)
      }
    }

    prevIndicatorsRef.current = selectedIndicators
  }, [selectedIndicators, chartData, indicatorData, chartType])

  // 更新数据
  useEffect(() => {
    const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
    const resolvedActiveSubplot = (activeSubplot && subplotIndicators.includes(activeSubplot))
      ? activeSubplot
      : subplotIndicators[0]

    if (seriesRef.current && chartData.length > 0) {
      // 转换主图数据
      const mainData = convertDataForSeries(chartData, chartType)

      // 成交量数据
      const volumeData = chartData.map(item => ({
        time: item.time,
        value: item.volume || 0,
        color: item.close >= item.open ? '#22c55e' : '#ef4444',
      }))

      // 移动平均线数据
      const ma5Data = calculateMA(chartData, 5)
      const ma10Data = calculateMA(chartData, 10)
      const ma20Data = calculateMA(chartData, 20)

      // 确保数据完全替换，避免重合
      seriesRef.current.setData(mainData)
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData)
      }

      if (ma5SeriesRef.current) ma5SeriesRef.current.setData(ma5Data)
      if (ma10SeriesRef.current) ma10SeriesRef.current.setData(ma10Data)
      if (ma20SeriesRef.current) ma20SeriesRef.current.setData(ma20Data)

      // 渲染技术指标数据
      if (indicatorData.EMA20 && ema20SeriesRef.current) {
        const ema20Data = indicatorData.EMA20.map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && item.value > 0)
        ema20SeriesRef.current.setData(ema20Data)
      }

      if (indicatorData.EMA50 && ema50SeriesRef.current) {
        const ema50Data = indicatorData.EMA50.map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && item.value > 0)
        ema50SeriesRef.current.setData(ema50Data)
      }

      if (indicatorData.EMA100 && ema100SeriesRef.current) {
        const ema100Data = indicatorData.EMA100.map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && item.value > 0)
        ema100SeriesRef.current.setData(ema100Data)
      }

      if (indicatorData.VWAP && vwapSeriesRef.current) {
        const vwapData = indicatorData.VWAP.map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && !isNaN(item.value) && item.value !== null)
        vwapSeriesRef.current.setData(vwapData)
      }

      // 渲染RSI指标 - 根据当前有效子图决定数据源
      if (rsiSeriesRef.current) {
        const rsiSource = resolvedActiveSubplot === 'RSI7' ? indicatorData.RSI7 : indicatorData.RSI14 || indicatorData.RSI7
        const rsiData = (rsiSource || []).map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && !isNaN(item.value) && item.value > 0)
        rsiSeriesRef.current.setData(rsiData)
      }

      // 渲染MACD指标 - 无条件应用如果数据存在
      if (indicatorData.MACD && macdSeriesRef.current) {
        const macdData = indicatorData.MACD
        if (macdData.macd && macdSeriesRef.current.macdLine) {
          const macdLineData = macdData.macd.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          macdSeriesRef.current.macdLine.setData(macdLineData)
        }
        if (macdData.signal && macdSeriesRef.current.signalLine) {
          const signalData = macdData.signal.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          macdSeriesRef.current.signalLine.setData(signalData)
        }
        if (macdData.histogram && macdSeriesRef.current.histogram) {
          const histogramData = macdData.histogram.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value,
            color: value >= 0 ? '#22c55e' : '#ef4444'
          })).filter((item: any) => item.time && !isNaN(item.value))
          macdSeriesRef.current.histogram.setData(histogramData)
        }
      }

      // 渲染ATR指标
      if (indicatorData.ATR14 && atrSeriesRef.current) {
        const atrData = indicatorData.ATR14.map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && !isNaN(item.value))
        atrSeriesRef.current.setData(atrData)
      }

      // 渲染STOCH指标
      if (indicatorData.STOCH && stochSeriesRef.current) {
        const stochData = indicatorData.STOCH
        if (stochData.k && stochSeriesRef.current.stochK) {
          const kData = stochData.k.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          stochSeriesRef.current.stochK.setData(kData)
        }
        if (stochData.d && stochSeriesRef.current.stochD) {
          const dData = stochData.d.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          stochSeriesRef.current.stochD.setData(dData)
        }
      }

      // 渲染OBV指标
      if (indicatorData.OBV && obvSeriesRef.current) {
        const obvData = indicatorData.OBV.map((value: number, index: number) => ({
          time: chartData[index]?.time,
          value: value
        })).filter((item: any) => item.time && !isNaN(item.value))
        obvSeriesRef.current.setData(obvData)
      }

      // 渲染BOLL布林带
      if (indicatorData.BOLL) {
        const bollData = indicatorData.BOLL
        if (bollData.upper && bollUpperSeriesRef.current) {
          const upperData = bollData.upper.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          bollUpperSeriesRef.current.setData(upperData)
        }
        if (bollData.middle && bollMiddleSeriesRef.current) {
          const middleData = bollData.middle.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          bollMiddleSeriesRef.current.setData(middleData)
        }
        if (bollData.lower && bollLowerSeriesRef.current) {
          const lowerData = bollData.lower.map((value: number, index: number) => ({
            time: chartData[index]?.time,
            value: value
          })).filter((item: any) => item.time && !isNaN(item.value))
          bollLowerSeriesRef.current.setData(lowerData)
        }
      }
    }
  }, [chartData, chartType, indicatorData])

  // 控制主图指标显示/隐藏 - 纯UI操作，不重绘图表
  useEffect(() => {
    // 移动平均线
    if (ma5SeriesRef.current) {
      ma5SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('MA5') })
    }
    if (ma10SeriesRef.current) {
      ma10SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('MA10') })
    }
    if (ma20SeriesRef.current) {
      ma20SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('MA20') })
    }

    // EMA指标
    if (ema20SeriesRef.current) {
      ema20SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('EMA20') })
    }
    if (ema50SeriesRef.current) {
      ema50SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('EMA50') })
    }
    if (ema100SeriesRef.current) {
      ema100SeriesRef.current.applyOptions({ visible: selectedIndicators.includes('EMA100') })
    }
    if (vwapSeriesRef.current) {
      vwapSeriesRef.current.applyOptions({ visible: selectedIndicators.includes('VWAP') })
    }

    // BOLL布林带
    const showBoll = selectedIndicators.includes('BOLL')
    if (bollUpperSeriesRef.current) {
      bollUpperSeriesRef.current.applyOptions({ visible: showBoll })
    }
    if (bollMiddleSeriesRef.current) {
      bollMiddleSeriesRef.current.applyOptions({ visible: showBoll })
    }
    if (bollLowerSeriesRef.current) {
      bollLowerSeriesRef.current.applyOptions({ visible: showBoll })
    }
  }, [selectedIndicators])

  // 更新指标 pane 标签
  const updateIndicatorPaneLabel = (labelText: string) => {
    if (indicatorPaneRef.current && indicatorLabelRef.current) {
      // 移除旧标签
      indicatorPaneRef.current.detachPrimitive(indicatorLabelRef.current)
      // 添加新标签
      const newLabel = createPaneLabel(labelText)
      indicatorPaneRef.current.attachPrimitive(newLabel)
      indicatorLabelRef.current = newLabel
    }
  }

  // 控制子图指标显示/隐藏 - 纯UI操作，不重绘图表
  useEffect(() => {
    const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
    const resolvedActiveSubplot = (activeSubplot && subplotIndicators.includes(activeSubplot))
      ? activeSubplot
      : subplotIndicators[0]

    // 检测新增的子图指标
    const prevSubplotIndicators = prevSubplotIndicatorsRef.current
    const newlyAddedIndicators = subplotIndicators.filter(ind => !prevSubplotIndicators.includes(ind))

    // 如果有新增的子图指标，自动切换到最新添加的指标
    if (newlyAddedIndicators.length > 0) {
      setActiveSubplot(newlyAddedIndicators[newlyAddedIndicators.length - 1])
    }
    // 设置默认激活的子图（仅在没有activeSubplot且有子图指标时）
    else if (subplotIndicators.length > 0 && !activeSubplot) {
      setActiveSubplot(subplotIndicators[0])
    }
    // 如果当前激活的子图不在选中列表中，切换到第一个可用的
    else if (activeSubplot && !subplotIndicators.includes(activeSubplot) && subplotIndicators.length > 0) {
      setActiveSubplot(subplotIndicators[0])
    }

    // 更新上一次的子图指标列表
    prevSubplotIndicatorsRef.current = subplotIndicators

    // 控制RSI显示
    if (rsiSeriesRef.current) {
      const showRSI = (resolvedActiveSubplot === 'RSI14' || resolvedActiveSubplot === 'RSI7') && selectedIndicators.includes(resolvedActiveSubplot)
      rsiSeriesRef.current.applyOptions({ visible: showRSI })
    }

    // 控制MACD显示
    if (macdSeriesRef.current) {
      const showMACD = resolvedActiveSubplot === 'MACD' && selectedIndicators.includes('MACD')
      if (macdSeriesRef.current.macdLine) {
        macdSeriesRef.current.macdLine.applyOptions({ visible: showMACD })
      }
      if (macdSeriesRef.current.signalLine) {
        macdSeriesRef.current.signalLine.applyOptions({ visible: showMACD })
      }
      if (macdSeriesRef.current.histogram) {
        macdSeriesRef.current.histogram.applyOptions({ visible: showMACD })
      }
    }

    // 控制ATR显示
    if (atrSeriesRef.current) {
      const showATR = resolvedActiveSubplot === 'ATR14' && selectedIndicators.includes('ATR14')
      atrSeriesRef.current.applyOptions({ visible: showATR })
    }

    // 控制STOCH显示
    if (stochSeriesRef.current) {
      const showSTOCH = resolvedActiveSubplot === 'STOCH' && selectedIndicators.includes('STOCH')
      if (stochSeriesRef.current.stochK) {
        stochSeriesRef.current.stochK.applyOptions({ visible: showSTOCH })
      }
      if (stochSeriesRef.current.stochD) {
        stochSeriesRef.current.stochD.applyOptions({ visible: showSTOCH })
      }
    }

    // 控制OBV显示
    if (obvSeriesRef.current) {
      const showOBV = resolvedActiveSubplot === 'OBV' && selectedIndicators.includes('OBV')
      obvSeriesRef.current.applyOptions({ visible: showOBV })
    }

    // Indicator pane label is fixed as "Indicators" - no need to update
  }, [selectedIndicators, activeSubplot])

  // Fetch market flow indicator data with loading state
  // Time range is derived from chartData to match K-line visible range
  const fetchFlowData = async (indicator: string) => {
    if (!indicator || !symbol) return

    onIndicatorLoadingChange?.(true)
    try {
      // Use chartData time range if available, otherwise fallback to 7 days
      let startTime: number
      let endTime: number

      if (chartData.length > 0) {
        // chartData.time is in local timezone (adjusted by formatChartTime for display)
        // Convert back to UTC for API request
        const firstTime = chartData[0].time
        const lastTime = chartData[chartData.length - 1].time
        const utcFirstTime = typeof firstTime === 'number' ? localToUtcTimestamp(firstTime) : new Date(firstTime).getTime() / 1000
        const utcLastTime = typeof lastTime === 'number' ? localToUtcTimestamp(lastTime) : new Date(lastTime).getTime() / 1000
        startTime = utcFirstTime * 1000
        endTime = utcLastTime * 1000
      } else {
        endTime = Date.now()
        startTime = endTime - 7 * 24 * 60 * 60 * 1000
      }

      const response = await fetch(
        `/api/market-flow/indicators?symbol=${symbol}&exchange=${exchange}&timeframe=${period}&start_time=${startTime}&end_time=${endTime}&indicators=${indicator}`
      )
      if (!response.ok) return

      const data = await response.json()
      setFlowDataAvailableFrom(data.data_available_from)
      const indicatorData = data.indicators[indicator] || []

      // Cache the data
      setFlowDataCache(prev => ({ ...prev, [indicator]: indicatorData }))

      // Update the series
      updateFlowSeries(indicator, indicatorData)
    } catch (error) {
      console.error('Failed to fetch flow data:', error)
    } finally {
      onIndicatorLoadingChange?.(false)
    }
  }

  // Get series ref for a flow indicator
  const getFlowSeriesRef = (indicator: string) => {
    switch (indicator) {
      case 'cvd': return flowCvdSeriesRef
      case 'taker_volume': return { buy: flowTakerBuySeriesRef, sell: flowTakerSellSeriesRef }
      case 'oi': return flowOiSeriesRef
      case 'oi_delta': return flowOiDeltaSeriesRef
      case 'funding': return flowFundingSeriesRef
      case 'depth_ratio': return flowDepthSeriesRef
      case 'order_imbalance': return flowImbalanceSeriesRef
      default: return null
    }
  }

  // Update flow series with data
  const updateFlowSeries = (indicator: string, data: any[]) => {
    if (!data || data.length === 0) return

    const colors = FLOW_COLORS[indicator]

    if (indicator === 'taker_volume') {
      if (flowTakerBuySeriesRef.current) {
        const buyData = data.map(d => ({
          time: formatChartTime(d.time),
          value: d.buy || 0,
          color: colors.up
        }))
        flowTakerBuySeriesRef.current.setData(buyData)
      }
      if (flowTakerSellSeriesRef.current) {
        const sellData = data.map(d => ({
          time: formatChartTime(d.time),
          value: -(d.sell || 0),
          color: colors.down
        }))
        flowTakerSellSeriesRef.current.setData(sellData)
      }
    } else {
      const seriesRef = getFlowSeriesRef(indicator)
      if (seriesRef && 'current' in seriesRef && seriesRef.current) {
        if (['oi_delta', 'order_imbalance'].includes(indicator)) {
          const histData = data.map(d => ({
            time: formatChartTime(d.time),
            value: d.value || 0,
            color: (d.value || 0) >= 0 ? colors.up : colors.down
          }))
          seriesRef.current.setData(histData)
        } else if (indicator === 'depth_ratio') {
          // Use log scale for depth_ratio to handle extreme values
          const lineData = data.map(d => ({
            time: formatChartTime(d.time),
            value: d.value > 0 ? Math.log10(d.value) : 0
          }))
          seriesRef.current.setData(lineData)
        } else if (indicator === 'funding') {
          // Multiply by 10000 to convert to basis points (bps) for better display
          // e.g., 0.000292% becomes 2.92 bps
          const lineData = data.map(d => ({
            time: formatChartTime(d.time),
            value: (d.value || 0) * 10000
          }))
          seriesRef.current.setData(lineData)
        } else {
          const lineData = data.map(d => ({
            time: formatChartTime(d.time),
            value: d.value
          }))
          seriesRef.current.setData(lineData)
        }
      }
    }
  }

  // Update flow pane label
  const updateFlowPaneLabel = (indicator: string) => {
    if (flowLabelRef.current && flowLabelRef.current.updateText) {
      flowLabelRef.current.updateText(FLOW_LABELS[indicator] || indicator)
    }
  }

  // Hide all flow series
  const hideAllFlowSeries = () => {
    flowCvdSeriesRef.current?.applyOptions({ visible: false })
    flowTakerBuySeriesRef.current?.applyOptions({ visible: false })
    flowTakerSellSeriesRef.current?.applyOptions({ visible: false })
    flowOiSeriesRef.current?.applyOptions({ visible: false })
    flowOiDeltaSeriesRef.current?.applyOptions({ visible: false })
    flowFundingSeriesRef.current?.applyOptions({ visible: false })
    flowDepthSeriesRef.current?.applyOptions({ visible: false })
    flowImbalanceSeriesRef.current?.applyOptions({ visible: false })
  }

  // Show specific flow series
  const showFlowSeries = (indicator: string) => {
    hideAllFlowSeries()
    if (indicator === 'taker_volume') {
      flowTakerBuySeriesRef.current?.applyOptions({ visible: true })
      flowTakerSellSeriesRef.current?.applyOptions({ visible: true })
    } else {
      const seriesRef = getFlowSeriesRef(indicator)
      if (seriesRef && 'current' in seriesRef && seriesRef.current) {
        seriesRef.current.applyOptions({ visible: true })
      }
    }
  }

  // 获取K线数据和指标
  const fetchKlineData = async (forceAllIndicators = false, incremental = false) => {
    if (loading) return

    if (!incremental) {
      setLoading(true)
      onIndicatorLoadingChange?.(true)
      onLoadingChange(true)
    }
    try {
      // 始终请求当前选中的指标，避免缓存缺失
      const indicatorsToFetch = selectedIndicators
      const indicatorsParam = indicatorsToFetch.length > 0 ? `&indicators=${indicatorsToFetch.join(',')}` : ''
      const count = incremental ? 500 : 500
      const response = await fetch(`/api/market/kline-with-indicators/${symbol}?market=${exchange}&period=${period}&count=${count}${indicatorsParam}`)
      const result = await response.json()

      if (result.klines && result.klines.length > 0) {
        const newChartData = result.klines.map((item: any) => ({
          time: formatChartTime(item.timestamp),
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          close: item.close || 0,
          volume: item.volume || 0,
        }))

        const mergedChartData = !incremental || chartData.length === 0
          ? newChartData
          : Array.from(
              new Map(
                [...chartData, ...newChartData].map(item => [item.time, item])
              ).values()
            ).sort((a, b) => a.time - b.time)

        setChartData(mergedChartData)

        // 合并新获取的指标数据
        if (result.indicators) {
          setIndicatorData(prev => ({ ...prev, ...result.indicators }))
          setCachedIndicators(prev => [...new Set([...prev, ...indicatorsToFetch])])
        }

        // 通知父组件最新数据，用于 AI 分析启用按钮
        if (onDataUpdate) {
          onDataUpdate(mergedChartData, result.indicators || {})
        }

        setHasData(true)
      } else {
        setHasData(false)
      }
    } catch (error) {
      console.error('Failed to fetch kline data:', error)
      setHasData(false)
    } finally {
      if (!incremental) {
        setLoading(false)
        onLoadingChange(false)
        onIndicatorLoadingChange?.(false)
      }
    }
  }

  // 当symbol、period或exchange变化时清空缓存并重新获取数据
  useEffect(() => {
    if (symbol && period) {
      // 立即清空图表数据和缓存
      setHasData(false)
      setChartData([])
      setIndicatorData({})
      setCachedIndicators([])

      // 清空所有series数据，避免新旧数据混合
      if (seriesRef.current) seriesRef.current.setData([])
      if (volumeSeriesRef.current) volumeSeriesRef.current.setData([])
      if (ma5SeriesRef.current) ma5SeriesRef.current.setData([])
      if (ma10SeriesRef.current) ma10SeriesRef.current.setData([])
      if (ma20SeriesRef.current) ma20SeriesRef.current.setData([])
      if (ema20SeriesRef.current) ema20SeriesRef.current.setData([])
      if (ema50SeriesRef.current) ema50SeriesRef.current.setData([])
      if (ema100SeriesRef.current) ema100SeriesRef.current.setData([])
      if (vwapSeriesRef.current) vwapSeriesRef.current.setData([])
      if (bollUpperSeriesRef.current) bollUpperSeriesRef.current.setData([])
      if (bollMiddleSeriesRef.current) bollMiddleSeriesRef.current.setData([])
      if (bollLowerSeriesRef.current) bollLowerSeriesRef.current.setData([])
      if (rsiSeriesRef.current) rsiSeriesRef.current.setData([])
      if (macdSeriesRef.current?.macdLine) macdSeriesRef.current.macdLine.setData([])
      if (macdSeriesRef.current?.signalLine) macdSeriesRef.current.signalLine.setData([])
      if (macdSeriesRef.current?.histogram) macdSeriesRef.current.histogram.setData([])
      if (atrSeriesRef.current) atrSeriesRef.current.setData([])
      if (stochSeriesRef.current?.stochK) stochSeriesRef.current.stochK.setData([])
      if (stochSeriesRef.current?.stochD) stochSeriesRef.current.stochD.setData([])
      if (obvSeriesRef.current) obvSeriesRef.current.setData([])

      // 强制请求所有选中指标
      fetchKlineData(true)
    }
  }, [symbol, period, exchange])

  // 当指标选择变化时，检查并获取缺失的指标数据
  useEffect(() => {
    if (symbol && period && selectedIndicators.length > 0) {
      const missingIndicators = selectedIndicators.filter(ind =>
        !cachedIndicators.includes(ind) || !indicatorData[ind]
      )
      if (missingIndicators.length > 0) {
        fetchKlineData()
      }
    }
  }, [selectedIndicators])

  useEffect(() => {
    if (!symbol || !period || incrementalRefreshToken <= 0) return

    const now = Date.now()
    if (now - lastIncrementalRefreshRef.current < 1500) return
    lastIncrementalRefreshRef.current = now
    fetchKlineData(false, true)
  }, [incrementalRefreshToken])

  // Handle market flow indicator changes - similar to technical indicators
  useEffect(() => {
    if (!chartRef.current) {
      return
    }

    const chart = chartRef.current
    const hasFlowIndicators = selectedFlowIndicators.length > 0

    if (hasFlowIndicators) {
      // Create flow pane if not exists
      if (!flowPaneRef.current) {
        const flowPane = chart.addPane()
        flowPane.setStretchFactor(1)
        const labelPrimitive = createPaneLabel('Market Flow')
        flowPane.attachPrimitive(labelPrimitive)
        flowLabelRef.current = labelPrimitive
        flowPaneRef.current = flowPane

        // Pre-create all series (initially hidden)
        // CVD - Line
        flowCvdSeriesRef.current = flowPane.addSeries(LineSeries, {
          color: FLOW_COLORS.cvd.line, lineWidth: 2, visible: false,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
        })
        // Taker Volume - Dual Histogram
        flowTakerBuySeriesRef.current = flowPane.addSeries(HistogramSeries, {
          color: FLOW_COLORS.taker_volume.up, visible: false,
          priceFormat: { type: 'volume' }
        })
        flowTakerSellSeriesRef.current = flowPane.addSeries(HistogramSeries, {
          color: FLOW_COLORS.taker_volume.down, visible: false,
          priceFormat: { type: 'volume' }
        })
        // OI - Line
        flowOiSeriesRef.current = flowPane.addSeries(LineSeries, {
          color: FLOW_COLORS.oi.line, lineWidth: 2, visible: false,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
        })
        // OI Delta - Histogram
        flowOiDeltaSeriesRef.current = flowPane.addSeries(HistogramSeries, {
          color: FLOW_COLORS.oi_delta.line, visible: false,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
        })
        // Funding - Line (values converted to bps, e.g., 0.000292% -> 2.92 bps)
        flowFundingSeriesRef.current = flowPane.addSeries(LineSeries, {
          color: FLOW_COLORS.funding.line, lineWidth: 2, visible: false,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
        })
        // Depth Ratio - Line
        flowDepthSeriesRef.current = flowPane.addSeries(LineSeries, {
          color: FLOW_COLORS.depth_ratio.line, lineWidth: 2, visible: false,
          priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
        })
        // Order Imbalance - Histogram
        flowImbalanceSeriesRef.current = flowPane.addSeries(HistogramSeries, {
          color: FLOW_COLORS.order_imbalance.line, visible: false,
          priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
        })
        // Update pane positions after flow pane created
        updatePanePositions()
      }

      // Detect newly added indicators
      const prevFlowIndicators = prevFlowIndicatorsRef.current
      const newlyAdded = selectedFlowIndicators.filter(ind => !prevFlowIndicators.includes(ind))

      // Auto-switch to newly added indicator
      if (newlyAdded.length > 0) {
        setActiveFlowIndicator(newlyAdded[newlyAdded.length - 1])
      }
      // Set default if no active indicator
      else if (!activeFlowIndicator || !selectedFlowIndicators.includes(activeFlowIndicator)) {
        setActiveFlowIndicator(selectedFlowIndicators[0])
      }

      // Update previous indicators ref
      prevFlowIndicatorsRef.current = selectedFlowIndicators

    } else {
      // Remove flow pane if no indicators selected
      if (flowPaneRef.current) {
        // Find the pane index before clearing refs
        const panes = chart.panes()
        const paneIndex = panes.indexOf(flowPaneRef.current)

        // Clear refs first to prevent any further operations
        flowPaneRef.current = null
        flowLabelRef.current = null
        flowCvdSeriesRef.current = null
        flowTakerBuySeriesRef.current = null
        flowTakerSellSeriesRef.current = null
        flowOiSeriesRef.current = null
        flowOiDeltaSeriesRef.current = null
        flowFundingSeriesRef.current = null
        flowDepthSeriesRef.current = null
        flowImbalanceSeriesRef.current = null

        // Now remove the pane by index (removePane takes index, not pane object)
        if (paneIndex > 0) {
          try {
            chart.removePane(paneIndex)
            // Update pane positions after flow pane removed
            updatePanePositions()
          } catch (e) {
            console.warn('Failed to remove flow pane:', e)
          }
        }
        setActiveFlowIndicator(null)
        setFlowDataCache({})
        setFlowDataAvailableFrom(null)
      }
      prevFlowIndicatorsRef.current = []
    }
  }, [selectedFlowIndicators])

  // Handle active flow indicator changes - show/hide series and fetch data
  useEffect(() => {
    if (!activeFlowIndicator || !flowPaneRef.current) return

    // Show the active series
    showFlowSeries(activeFlowIndicator)

    // Update label
    updateFlowPaneLabel(activeFlowIndicator)

    // Fetch data if not cached
    if (!flowDataCache[activeFlowIndicator]) {
      fetchFlowData(activeFlowIndicator)
    } else {
      // Use cached data
      updateFlowSeries(activeFlowIndicator, flowDataCache[activeFlowIndicator])
    }
  }, [activeFlowIndicator])

  // Re-fetch flow data when symbol, period, exchange, or chartData changes
  useEffect(() => {
    if (selectedFlowIndicators.length > 0 && flowPaneRef.current && chartData.length > 0) {
      // Clear all flow series data first (consistent with main chart behavior)
      if (flowCvdSeriesRef.current) flowCvdSeriesRef.current.setData([])
      if (flowTakerBuySeriesRef.current) flowTakerBuySeriesRef.current.setData([])
      if (flowTakerSellSeriesRef.current) flowTakerSellSeriesRef.current.setData([])
      if (flowOiSeriesRef.current) flowOiSeriesRef.current.setData([])
      if (flowOiDeltaSeriesRef.current) flowOiDeltaSeriesRef.current.setData([])
      if (flowFundingSeriesRef.current) flowFundingSeriesRef.current.setData([])
      if (flowDepthSeriesRef.current) flowDepthSeriesRef.current.setData([])
      if (flowImbalanceSeriesRef.current) flowImbalanceSeriesRef.current.setData([])
      // Clear cache and re-fetch active indicator
      setFlowDataCache({})
      if (activeFlowIndicator) {
        fetchFlowData(activeFlowIndicator)
      }
    }
  }, [symbol, period, exchange, chartData.length])

  return (
    <div className="relative h-full w-full overflow-hidden">


      {/* 图表容器 - 铺满父元素 */}
      <div ref={chartContainerRef} className="w-full h-full" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {overlayMarkers.map((item) => (
          (() => {
            const isCandleActive = (hoveredMarkerCandleTime ?? hoveredCandleTime) === item.marker.chartTime
            const isSelected = activeEventMarkerId === item.marker.id
            const scaleClass = isSelected
              ? 'scale-[1.2]'
              : isCandleActive
                ? 'scale-110'
                : 'scale-100'
            const opacityClass = isCandleActive ? 'opacity-100' : 'opacity-35'
            return (
          <button
            key={item.key}
            type="button"
            className={`pointer-events-auto absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-150 ${
              item.marker.iconVariant === 'news'
                ? 'border-blue-200 text-blue-700'
                : item.marker.iconVariant === 'flow-down'
                  ? 'border-red-200 text-red-600'
                  : 'border-emerald-200 text-emerald-600'
            } ${isSelected ? 'ring-2 ring-sky-300/70 ring-offset-1 ring-offset-background' : ''} ${scaleClass} ${opacityClass}`}
            style={{ left: item.x, top: item.y }}
            onMouseEnter={() => {
              setHoveredMarker({ x: item.x, y: item.y, marker: item.marker })
              setHoveredMarkerCandleTime(item.marker.chartTime ?? null)
            }}
            onMouseLeave={() => {
              setHoveredMarker(null)
              setHoveredMarkerCandleTime(null)
            }}
            onClick={() => {
              if (item.marker.id) onEventMarkerClick?.(item.marker.id)
              setHoveredMarker({ x: item.x, y: item.y, marker: item.marker })
              setHoveredMarkerCandleTime(item.marker.chartTime ?? null)
            }}
          >
            {item.marker.iconVariant === 'news' ? (
              <NewsMarkerIcon />
            ) : (
              <FlowMarkerIcon direction={item.marker.iconVariant === 'flow-down' ? 'down' : 'up'} />
            )}
          </button>
            )
          })()
        ))}
      </div>

      {hoveredMarker && (
        <div
          className="pointer-events-none absolute z-20 w-64 rounded-xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: Math.min(Math.max(hoveredMarker.x + 16, 12), (chartContainerRef.current?.clientWidth || 320) - 272),
            top: Math.min(Math.max(hoveredMarker.y + 16, 12), (chartContainerRef.current?.clientHeight || 240) - 140),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-foreground">{hoveredMarker.marker.title || hoveredMarker.marker.kind || 'Event'}</div>
            {hoveredMarker.marker.tone && (
              <div className={`text-[10px] uppercase tracking-[0.2em] ${
                hoveredMarker.marker.tone === 'bullish'
                  ? 'text-emerald-600'
                  : hoveredMarker.marker.tone === 'bearish'
                    ? 'text-orange-600'
                    : 'text-slate-500'
              }`}>
                {hoveredMarker.marker.tone}
              </div>
            )}
          </div>
          {hoveredMarker.marker.summary && (
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {hoveredMarker.marker.summary}
            </div>
          )}
          <div className="mt-2 text-[11px] text-muted-foreground">
            {new Date(hoveredMarker.marker.time).toLocaleString()}
          </div>
          {Array.isArray(hoveredMarker.marker.metadata) && hoveredMarker.marker.metadata.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hoveredMarker.marker.metadata.slice(0, 3).map((item: string, index: number) => (
                <span key={`${hoveredMarker.marker.id || hoveredMarker.marker.time}-${index}`} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}


      {/* 指标子图切换器 - positioned at indicator pane top-left */}
      {(() => {
        const subplotIndicators = selectedIndicators.filter(ind => ['RSI14', 'RSI7', 'MACD', 'ATR14', 'STOCH', 'OBV'].includes(ind))
        // Always show selector when there are indicators (1 or more)
        if (subplotIndicators.length === 0 || indicatorPaneTop === null) return null

        const currentActiveSubplot = activeSubplot || subplotIndicators[0]

        return (
          <div
            className="absolute left-2 z-10 flex items-center bg-background/80 backdrop-blur-sm rounded-md p-1 px-2 border text-xs"
            style={{ top: indicatorPaneTop + 4 }}
          >
            <select
              value={currentActiveSubplot}
              onChange={(e) => setActiveSubplot(e.target.value)}
              className="bg-transparent border-0 text-xs focus:outline-none cursor-pointer"
              disabled={subplotIndicators.length === 1}
            >
              {subplotIndicators.map(indicator => (
                <option key={indicator} value={indicator}>
                  {indicator}
                </option>
              ))}
            </select>
          </div>
        )
      })()}

      {/* Market Flow indicator selector - positioned at flow pane top-left */}
      {/* Always show selector when there are flow indicators (1 or more) */}
      {selectedFlowIndicators.length > 0 && activeFlowIndicator && flowPaneTop !== null && (
        <div
          className="absolute left-2 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md p-1 px-2 border text-xs"
          style={{ top: flowPaneTop + 4 }}
        >
          <select
            value={activeFlowIndicator}
            onChange={(e) => setActiveFlowIndicator(e.target.value)}
            className="bg-transparent border-0 text-xs focus:outline-none cursor-pointer text-cyan-400"
            disabled={selectedFlowIndicators.length === 1}
          >
            {selectedFlowIndicators.map(indicator => (
              <option key={indicator} value={indicator}>
                {FLOW_LABELS[indicator]}
              </option>
            ))}
          </select>
          {flowDataAvailableFrom && (
            <span className="text-muted-foreground">
              from {new Date(flowDataAvailableFrom).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* 自定义水印 */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/30 pointer-events-none select-none">
        Hyper Alpha Arena
      </div>


      {!loading && !hasData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No K-line data available</p>
            <p className="text-sm">Click "Backfill Historical Data" to fetch data</p>
          </div>
        </div>
      )}
    </div>
  )
}
