const testPython = `trades = db.t("LearnDeephaven", "StockTrades").where("Date=\`2017-08-25\`")\\
    .headBy(3, "Sym")\\
    .view("Sym", "Last")

summary = trades.view("Sym", "AvgPrice=Last").avgBy("Sym")

lj = summary.leftJoin(trades, "Sym", "Last")



def rollingAvg(rows, values):
        calculations = jpy.array('double', values.size()) # create an array of integers

        sum = 0
        n = 0
        avg = 0

        for i in range(values.size()):
            sum += values.get(i) #add each value to sum
            if (i >= rows): sum -= values.get(i - rows) #subtract when needed

            n = i + 1 if (i < rows) else rows #n increments with i until i=rows
            avg = sum / n #get updated average every iteration

            calculations[i] = avg #store running average

        return calculations #return an array of rolling averages

def rollingStd(rows, values, averages):
    calculations = jpy.array('double', values.size()) # create an array of integers

    sum = 0
    n = 0

    for i in range(values.size()):
        sum = 0

        j = i
        while j >= 0 and j > i - rows:
            difference = values.get(j) - averages[i]
            squareDiff = difference ** 2
            sum += squareDiff
            j -= 1

        n = i + 1 if (i < rows) else rows
        variance = sum / n
        standardDev = variance ** (1/2.0)
        calculations[i] = standardDev

    return calculations

trades = db.t("LearnDeephaven", "StockTrades")\\
    .where("Date=\`2017-08-25\`")\\
    .view("Sym", "Last", "Size", "ExchangeTimestamp")

trades30min = trades.updateView("TimeBin=lowerBin(ExchangeTimestamp, 30*MINUTE)")\\
    .firstBy("Sym", "TimeBin")

rollingCalc = trades30min.by("Sym")\\
    .update("Avg=(double[])rollingAvg.call(30, Last)",
        "Std=(double[])rollingStd.call(30, Last, Avg)")\\
    .ungroup()
minEdge = 0.5
maxPos = 3.0
liquidity = 1e6

targetPos = rollingCalc.updateView("Zscore=(Avg-Last)/Std if (Std > 0) else NULL_DOUBLE", "AdjZscore=signum(Zscore) * min(maxPos, max(abs(Zscore)-minEdge), 0.0)", "TargetPosition=(int)(liquidity*AdjZscore/Last)")\\
    .dropColumns("ExchangeTimestamp", "Avg", "Std", "Zscore", "AdjZscore")

timeBinIndexes = targetPos.leftJoin(trades30min, "Sym", "Times=ExchangeTimestamp, SharesTraded=Size")\\
    .updateView("StartIndex=binSearchIndex(Times, TimeBin-30*MINUTE, BS_LOWEST)", "EndIndex=binSearchIndex(Times, TimeBin, BS_HIGHEST)")\\
    .dropColumns("Times")

shares30min = timeBinIndexes.updateView("SharesTraded30Min=sum(SharesTraded.subArray(StartIndex, EndIndex))")\\
    .dropColumns("SharesTraded", "StartIndex", "EndIndex")

from math import copysign
class SimulatorState:
    def __init__(self):
        self.hm = {}

    def __call__(self, sym, targetPos, shares10s):
        if sym not in self.hm:
            self.hm[sym] = [0.0] * 2
        tradedAndPosition = self.hm[sym]
        tradedAndPosition[0] = 0.0 if (targetPos == None) else copysign(1, targetPos - tradedAndPosition[1]) * min(abs(targetPos - tradedAndPosition[1]), shares10s * 0.1)
        tradedAndPosition[1] += tradedAndPosition[0]
        return jpy.array('double', list(tradedAndPosition))

ss = SimulatorState()

simulation = shares30min.update("Values=(double[])ss.call(Sym, TargetPosition, SharesTraded30Min)", "PositionChange=Values[0]", "Position=Values[1]")\\
    .dropColumns("Values")
`;
const testGroovy = `trades = db.t("LearnDeephaven", "StockTrades").where("Date=\`2017-08-25\`")
     .headBy(3, "Sym")
     .view("Sym", "Last")

summary = trades.view("Sym", "AvgPrice=Last").avgBy("Sym")

lj = summary.leftJoin(trades, "Sym", "Last")


rollingAvg = { rows, values ->
 
    calculations = new double[values.size()]
 
    sum = 0
    n = 0
    avg = 0
 
    for (int i = 0; i < values.size(); ++i)
   {
        sum += values.get(i) //add each value to sum
        if (i >= rows) sum -= values.get(i - rows) //subtract when needed
 
        n = (i < rows) ? i + 1 : rows //n increments with i until i=rows
        avg = sum / n //get updated average every iteration
 
        calculations[i] = avg //store running average
    }
 
    return calculations //return an array of rolling averages
}

rollingStd = { rows, values, averages ->
    calculations = new double[values.size()]

    sum = 0
    n = 0

    for (int i = 0; i < values.size(); ++i)
    {
        sum = 0
        for (int j = i; j >= 0 && j > i - rows; --j)
        {
            difference = values.get(j) - averages[i]
            squareDiff = Math.pow(difference, 2)
            sum += squareDiff
        }

        n = (i < rows) ? i + 1 : rows
        variance = sum / n
        standardDev = Math.sqrt(variance)
        calculations[i] = standardDev
    }
    return calculations
}

trades = db.t("LearnDeephaven", "StockTrades")
     .where("Date=\`2017-08-25\`")
     .view("Sym", "Last", "Size", "ExchangeTimestamp")

trades30min = trades.updateView("TimeBin=lowerBin(ExchangeTimestamp, 30*MINUTE)")
     .firstBy("Sym", "TimeBin")

rollingCalc = trades30min.by("Sym")
     .update("Avg=(double[])rollingAvg.call(30, Last)","Std=(double[])rollingStd.call(30, Last, Avg)")
.ungroup()

minEdge = 0.5d
maxPos = 3.0d
liquidity = 1e6d

targetPos = rollingCalc.updateView("Zscore=(Std > 0) ? (Avg-Last)/Std : NULL_DOUBLE", "AdjZscore=signum(Zscore) * min(maxPos, max(abs(Zscore)-minEdge), 0.0)", "TargetPosition=(int)(liquidity*AdjZscore/Last)")
     .dropColumns("ExchangeTimestamp", "Avg", "Std", "Zscore", "AdjZscore")

timeBinIndexes = targetPos.leftJoin(trades30min, "Sym", "Times=ExchangeTimestamp, SharesTraded=Size")
     .updateView("StartIndex=binSearchIndex(Times, TimeBin-30*MINUTE, BS_LOWEST)", "EndIndex=binSearchIndex(Times, TimeBin, BS_HIGHEST)")
     .dropColumns("Times")

shares30min = timeBinIndexes.updateView("SharesTraded30Min=sum(SharesTraded.subArray(StartIndex, EndIndex))")
     .dropColumns("SharesTraded", "StartIndex", "EndIndex")


class SimulatorState
{
private HashMap<String, double[]> hm = new HashMap<>();

    public double[] update(String sym, int targetPos, int shares10s)
    {
        if (!hm.containsKey(sym)) hm.put(sym, new double[2]);

        double[] tradedAndPosition = hm.get(sym);

        tradedAndPosition[0] =
        isNull(targetPos) ? 0.0 : signum(targetPos - tradedAndPosition[1]) * min(abs(targetPos - tradedAndPosition[1]), shares10s * 0.1d)
        tradedAndPosition[1] += tradedAndPosition[0];

        return Arrays.copyOf(tradedAndPosition, tradedAndPosition.length);
   }
}
ss = new SimulatorState()

simulation = shares30min.update("Values=(double[])ss.update(Sym, TargetPosition, SharesTraded30Min)", "PositionChange=Values[0]", "Position=Values[1]")
     .dropColumns("Values")

`;

export default { testPython, testGroovy };
