"""
Factor Expression Engine

Safely evaluates user/AI-submitted factor expressions against K-line data.
Uses asteval (safe expression evaluator) + pandas-ta (130+ TA indicators).

Example expressions:
    EMA(close, 7) / EMA(close, 21) - 1
    RSI(close, 14) - 50
    ATR(high, low, close, 14) / close
    DELTA(close, 5) / STDDEV(close, 20)
"""

import logging
import numpy as np
import pandas as pd
from asteval import Interpreter
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class FactorExpressionEngine:
    """Evaluate factor expressions safely using asteval + pandas-ta."""

    # Available functions exposed to expressions
    FUNCTION_DOCS = {
        "SMA": "SMA(series, period) - Simple Moving Average",
        "EMA": "EMA(series, period) - Exponential Moving Average",
        "WMA": "WMA(series, period) - Weighted Moving Average",
        "RSI": "RSI(series, period) - Relative Strength Index",
        "ROC": "ROC(series, period) - Rate of Change (%)",
        "MACD": "MACD(series, fast, slow, signal) - MACD line",
        "MACD_SIGNAL": "MACD_SIGNAL(series, fast, slow, signal) - MACD signal line",
        "MACD_HIST": "MACD_HIST(series, fast, slow, signal) - MACD histogram",
        "STOCH_K": "STOCH_K(high, low, close, period) - Stochastic %K",
        "STOCH_D": "STOCH_D(high, low, close, period) - Stochastic %D",
        "CCI": "CCI(high, low, close, period) - Commodity Channel Index",
        "WILLR": "WILLR(high, low, close, period) - Williams %R",
        "MOM": "MOM(series, period) - Momentum",
        "ATR": "ATR(high, low, close, period) - Average True Range",
        "STDDEV": "STDDEV(series, period) - Standard Deviation",
        "BBANDS_UPPER": "BBANDS_UPPER(series, period) - Bollinger upper band",
        "BBANDS_LOWER": "BBANDS_LOWER(series, period) - Bollinger lower band",
        "BBANDS_MID": "BBANDS_MID(series, period) - Bollinger middle band",
        "OBV": "OBV(close, volume) - On-Balance Volume",
        "VWAP": "VWAP(high, low, close, volume) - Volume Weighted Avg Price",
        "DELAY": "DELAY(series, period) - Value N bars ago",
        "DELTA": "DELTA(series, period) - Difference from N bars ago",
        "TS_MAX": "TS_MAX(series, period) - Rolling max",
        "TS_MIN": "TS_MIN(series, period) - Rolling min",
        "TS_RANK": "TS_RANK(series, period) - Rolling percentile rank",
        "RANK": "RANK(series) - Cross-sectional rank (0-1)",
        "ZSCORE": "ZSCORE(series) - Z-score normalization",
        "ABS": "ABS(x) - Absolute value",
        "LOG": "LOG(x) - Natural logarithm",
        "SIGN": "SIGN(x) - Sign (-1, 0, 1)",
        "MAX": "MAX(a, b) - Element-wise maximum",
        "MIN": "MIN(a, b) - Element-wise minimum",
    }

    def __init__(self):
        self._ta = None

    def _ensure_ta(self):
        if self._ta is None:
            import pandas_ta as ta
            self._ta = ta

    def _to_series(self, x) -> pd.Series:
        if isinstance(x, pd.Series):
            return x
        return pd.Series(x, dtype=float)

    def _build_functions(self, df: pd.DataFrame) -> Dict:
        """Build function dict bound to the given DataFrame context."""
        self._ensure_ta()
        ta = self._ta
        s = self._to_series

        funcs = {}

        # Moving Average
        funcs["SMA"] = lambda series, period=20: ta.sma(s(series), length=int(period))
        funcs["EMA"] = lambda series, period=20: ta.ema(s(series), length=int(period))
        funcs["WMA"] = lambda series, period=20: ta.wma(s(series), length=int(period))

        # Momentum
        funcs["RSI"] = lambda series, period=14: ta.rsi(s(series), length=int(period))
        funcs["ROC"] = lambda series, period=10: ta.roc(s(series), length=int(period))
        funcs["MOM"] = lambda series, period=10: ta.mom(s(series), length=int(period))

        def _macd_line(series, fast=12, slow=26, signal=9):
            r = ta.macd(s(series), fast=int(fast), slow=int(slow), signal=int(signal))
            return r.iloc[:, 0] if r is not None and not r.empty else s(series) * 0

        def _macd_signal(series, fast=12, slow=26, signal=9):
            r = ta.macd(s(series), fast=int(fast), slow=int(slow), signal=int(signal))
            return r.iloc[:, 1] if r is not None and r.shape[1] > 1 else s(series) * 0

        def _macd_hist(series, fast=12, slow=26, signal=9):
            r = ta.macd(s(series), fast=int(fast), slow=int(slow), signal=int(signal))
            return r.iloc[:, 2] if r is not None and r.shape[1] > 2 else s(series) * 0

        funcs["MACD"] = _macd_line
        funcs["MACD_SIGNAL"] = _macd_signal
        funcs["MACD_HIST"] = _macd_hist

        def _stoch_k(high, low, close, period=14):
            r = ta.stoch(s(high), s(low), s(close), k=int(period))
            return r.iloc[:, 0] if r is not None and not r.empty else s(close) * 0

        def _stoch_d(high, low, close, period=14):
            r = ta.stoch(s(high), s(low), s(close), k=int(period))
            return r.iloc[:, 1] if r is not None and r.shape[1] > 1 else s(close) * 0

        funcs["STOCH_K"] = _stoch_k
        funcs["STOCH_D"] = _stoch_d
        funcs["CCI"] = lambda h, l, c, period=20: ta.cci(s(h), s(l), s(c), length=int(period))
        funcs["WILLR"] = lambda h, l, c, period=14: ta.willr(s(h), s(l), s(c), length=int(period))

        # Volatility
        funcs["ATR"] = lambda h, l, c, period=14: ta.atr(s(h), s(l), s(c), length=int(period))
        funcs["STDDEV"] = lambda series, period=20: s(series).rolling(window=int(period)).std()

        def _bb(series, period=20, col_idx=0):
            r = ta.bbands(s(series), length=int(period))
            if r is not None and r.shape[1] > col_idx:
                return r.iloc[:, col_idx]
            return s(series) * 0

        funcs["BBANDS_LOWER"] = lambda series, period=20: _bb(series, period, 0)
        funcs["BBANDS_MID"] = lambda series, period=20: _bb(series, period, 1)
        funcs["BBANDS_UPPER"] = lambda series, period=20: _bb(series, period, 2)

        # Volume
        funcs["OBV"] = lambda close, volume: ta.obv(s(close), s(volume))
        funcs["VWAP"] = lambda h, l, c, v: ta.vwap(s(h), s(l), s(c), s(v))

        # Time Series
        funcs["DELAY"] = lambda series, period=1: s(series).shift(int(period))
        funcs["DELTA"] = lambda series, period=1: s(series).diff(int(period))
        funcs["TS_MAX"] = lambda series, period=20: s(series).rolling(window=int(period)).max()
        funcs["TS_MIN"] = lambda series, period=20: s(series).rolling(window=int(period)).min()

        def _ts_rank(series, period=20):
            sr = s(series)
            return sr.rolling(window=int(period)).apply(
                lambda x: pd.Series(x).rank(pct=True).iloc[-1], raw=False
            )
        funcs["TS_RANK"] = _ts_rank

        # Cross-section
        funcs["RANK"] = lambda series: s(series).rank(pct=True)
        funcs["ZSCORE"] = lambda series: (s(series) - s(series).mean()) / (s(series).std() + 1e-10)

        # Math
        funcs["ABS"] = lambda x: np.abs(s(x)) if hasattr(x, '__len__') else abs(x)
        funcs["LOG"] = lambda x: np.log(s(x).clip(lower=1e-10)) if hasattr(x, '__len__') else np.log(max(x, 1e-10))
        funcs["SIGN"] = lambda x: np.sign(s(x)) if hasattr(x, '__len__') else np.sign(x)
        funcs["MAX"] = lambda a, b: np.maximum(s(a), s(b))
        funcs["MIN"] = lambda a, b: np.minimum(s(a), s(b))

        return funcs

    def validate(self, expression: str) -> Tuple[bool, str]:
        """Validate expression syntax without executing. Returns (ok, error_msg)."""
        if not expression or not expression.strip():
            return False, "Expression is empty"
        if len(expression) > 500:
            return False, "Expression too long (max 500 chars)"

        try:
            aeval = Interpreter(minimal=True)
            aeval.parse(expression)
            if aeval.error:
                errors = "; ".join(str(e.get_error()[1]) for e in aeval.error)
                return False, f"Syntax error: {errors}"
        except SyntaxError as e:
            return False, f"Syntax error: {str(e) or 'invalid expression'}"
        except Exception as e:
            return False, f"Parse error: {str(e)}"
        return True, ""

    def execute(self, expression: str, klines: List[Dict]) -> Tuple[Optional[pd.Series], str]:
        """
        Execute expression against K-line data.
        Returns (result_series, error_msg). result_series is None on error.
        """
        ok, err = self.validate(expression)
        if not ok:
            return None, err

        if not klines or len(klines) < 10:
            return None, "Insufficient K-line data (need at least 10 bars)"

        # Build DataFrame from klines
        df = pd.DataFrame(klines)
        for col in ["open", "high", "low", "close", "volume"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Create safe interpreter
        aeval = Interpreter(minimal=True)

        # Inject K-line columns as variables
        aeval.symtable["open"] = df["open"]
        aeval.symtable["high"] = df["high"]
        aeval.symtable["low"] = df["low"]
        aeval.symtable["close"] = df["close"]
        aeval.symtable["volume"] = df["volume"]

        # Inject TA functions
        for name, func in self._build_functions(df).items():
            aeval.symtable[name] = func

        # Inject numpy for arithmetic
        aeval.symtable["np"] = np

        # Execute
        try:
            result = aeval(expression)
        except Exception as e:
            return None, f"Execution error: {str(e)}"

        if aeval.error:
            errors = "; ".join(str(e.get_error()[1]) for e in aeval.error)
            return None, f"Evaluation error: {errors}"

        if result is None:
            return None, "Expression returned None"

        # Convert to Series
        if isinstance(result, pd.Series):
            return result, ""
        if isinstance(result, (np.ndarray, list)):
            return pd.Series(result, dtype=float), ""
        if isinstance(result, (int, float)):
            return pd.Series([result] * len(df), dtype=float), ""

        return None, f"Unexpected result type: {type(result).__name__}"

    def evaluate_ic(
        self,
        expression: str,
        klines: List[Dict],
        forward_periods: Dict[str, int] = None,
    ) -> Tuple[Optional[Dict], str]:
        """
        Evaluate expression and compute IC/ICIR/win_rate for each forward period.
        Returns (results_dict, error_msg).
        """
        if forward_periods is None:
            forward_periods = {"1h": 1, "4h": 4, "12h": 12, "24h": 24}

        series, err = self.execute(expression, klines)
        if series is None:
            return None, err

        closes = pd.to_numeric(pd.DataFrame(klines)["close"], errors="coerce")
        factor_vals = series.values
        close_vals = closes.values
        n = len(factor_vals)

        from scipy.stats import spearmanr

        results = {}
        for fp_label, fp_offset in forward_periods.items():
            if fp_offset >= n - 10:
                continue

            aligned_fv, aligned_rt = [], []
            for i in range(n - fp_offset):
                fv = factor_vals[i]
                cv = close_vals[i]
                if pd.isna(fv) or pd.isna(cv) or cv == 0:
                    continue
                ret = (close_vals[i + fp_offset] - cv) / cv
                aligned_fv.append(fv)
                aligned_rt.append(ret)

            if len(aligned_fv) < 10:
                continue

            fv_arr = np.array(aligned_fv)
            rt_arr = np.array(aligned_rt)

            ic, _ = spearmanr(fv_arr, rt_arr)
            ic = float(ic) if not np.isnan(ic) else 0.0

            # Rolling IC for ICIR
            window = min(20, max(5, len(aligned_fv) // 4))
            ics = []
            if window >= 5 and len(aligned_fv) >= window * 2:
                for i in range(len(aligned_fv) - window + 1):
                    c, _ = spearmanr(fv_arr[i:i+window], rt_arr[i:i+window])
                    if not np.isnan(c):
                        ics.append(c)

            ic_mean = float(np.mean(ics)) if ics else ic
            ic_std = float(np.std(ics)) if ics else 0.0
            icir = ic_mean / ic_std if ic_std > 1e-8 else 0.0

            signs_match = np.sign(fv_arr) == np.sign(rt_arr)
            win_rate = float(signs_match.mean())

            results[fp_label] = {
                "ic_mean": round(ic_mean, 6),
                "ic_std": round(ic_std, 6),
                "icir": round(icir, 4),
                "win_rate": round(win_rate, 4),
                "sample_count": len(aligned_fv),
            }

        if not results:
            return None, "Not enough aligned data for IC calculation"

        return results, ""


# Singleton
factor_expression_engine = FactorExpressionEngine()
