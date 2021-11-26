export default Object.freeze({
  LOREM_IPSUM: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur feugiat ipsum et velit lacinia, ut venenatis augue dignissim. Quisque varius ligula ac felis ornare, sed semper metus ullamcorper. Praesent et sodales sapien, nec bibendum tellus. Donec id tortor porta ipsum efficitur viverra ut at est. Quisque suscipit laoreet risus id lobortis. Nunc porttitor pretium mi, fringilla maximus tortor commodo non. Aliquam erat volutpat. Vestibulum egestas magna a neque eleifend, id tempus velit consequat. Etiam gravida neque in arcu ullamcorper, ac facilisis lorem pretium.

Sed pretium scelerisque massa, vitae consectetur risus varius eget. Nam finibus volutpat ante ut consectetur. Quisque feugiat enim lacus, a iaculis lectus vehicula eget. Nam pellentesque nulla ut metus semper condimentum. Curabitur vulputate metus vitae pretium pretium. Nulla facilisi. Sed massa magna, sagittis venenatis rhoncus in, laoreet ac felis. Maecenas fringilla augue tortor, feugiat interdum felis maximus et. Vivamus ac sapien metus. Donec feugiat elit a purus sodales rutrum. Nam hendrerit vel ante ut ultrices. Duis maximus lectus ante, nec bibendum ante volutpat et. Ut non mi at elit imperdiet aliquet ut maximus lacus. Sed turpis magna, vulputate in purus non, cursus dignissim ipsum. Etiam ac aliquam purus, sit amet congue quam. Nam iaculis augue a molestie semper.

Cras iaculis gravida erat, id vulputate turpis vestibulum ut. Phasellus hendrerit, nisi eu pulvinar maximus, ex leo vehicula mi, quis fringilla metus arcu eget turpis. Phasellus in finibus diam. Nulla commodo, mauris eget consequat luctus, turpis felis placerat dolor, ut rutrum justo mi in sem. Cras maximus fermentum metus sed molestie. Fusce eu neque semper, congue erat sit amet, fermentum arcu. Duis viverra felis turpis, in eleifend ex dictum ac. Vestibulum sit amet egestas quam, pretium convallis dolor. Phasellus id odio sed augue placerat tincidunt non a sem. Mauris commodo egestas hendrerit. Praesent vel ante a purus auctor cursus. Quisque laoreet libero sem, quis laoreet risus venenatis a. Mauris a convallis magna, a facilisis lorem. Pellentesque nec dui id velit euismod ultrices. Cras malesuada libero leo, a lacinia eros tristique a.

Praesent aliquam dui a interdum ultrices. Suspendisse potenti. Phasellus ultrices tellus orci, in luctus ex dapibus eget. Sed quis mauris eu tortor varius consectetur. Sed efficitur elementum orci, et commodo dui maximus et. Morbi ut sem ac orci tempus mattis. Aenean sit amet auctor velit. Etiam vel dapibus lectus. Morbi vel tellus vel massa bibendum tristique. Nullam interdum, tellus sed venenatis lobortis, ligula nisi dictum augue, egestas malesuada nisl augue vitae orci. Vivamus ut magna vulputate, elementum dolor nec, blandit neque. Nulla facilisi.

Donec dignissim augue urna, sed condimentum turpis finibus lobortis. Proin et fermentum massa, quis efficitur libero. Mauris pharetra et nisi eget vehicula. Curabitur nec augue quis nunc blandit sollicitudin vitae ac massa. Curabitur fermentum suscipit lorem. Nulla odio diam, tempor vel purus eu, malesuada eleifend lacus. Sed bibendum nisi quis est egestas, et vestibulum ex lobortis. Vivamus mauris metus, faucibus vel ligula sit amet, pulvinar hendrerit felis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nunc nec magna vel ligula tempor rutrum.`,
  JSON: `{"command":"x=db.i(\\"DXFeed\\",\\"TradeStock\\").where(\\"Date=currentDateNy()\\")

multiSeries = plot(\\"Microsoft\\", x.where(\\"Sym=\`MSFT\`\\"), \\"TradeTimestamp\\", \\"Price\\").twinX().plot(\\"Apple\\", x.where(\\"Sym=\`AAPL\`\\"), \\"TradeTimestamp\\", \\"Price\\").show()","startTime":"2019-06-18T14:32:40.707Z","endTime":"2019-06-18T14:32:41.023Z","result":{"error":"Error class java.lang.RuntimeException: Error encountered at line 1: x=db.i(\\"DXFeed\\",\\"TradeStock\\").where(\\"Date=currentDateNy()\\")
	io.deephaven.db.util.IrisDbGroovySession.maybeRewriteStackTrace(IrisDbGroovySession.java:280)
	io.deephaven.db.util.IrisDbGroovySession.wrapAndRewriteStackTrace(IrisDbGroovySession.java:261)
	io.deephaven.db.util.IrisDbGroovySession.evaluate(IrisDbGroovySession.java:253)
	io.deephaven.console.events.RemoteScriptCommandQuery.execute(RemoteScriptCommandQuery.java:94)
	io.deephaven.console.events.RemoteScriptCommandQuery.execute(RemoteScriptCommandQuery.java:26)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$QueryAction.lambda$execute$0(RemoteQueryProcessor.java:1809)
	io.deephaven.util.locks.FunctionalLock.computeLockedInterruptibly(FunctionalLock.java:80)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$QueryAction.execute(RemoteQueryProcessor.java:1809)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler.runSyncQueryAndSendResult(RemoteQueryProcessor.java:1578)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler.handleCommandST(RemoteQueryProcessor.java:1482)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler$HandleCommandRunnable.run(RemoteQueryProcessor.java:1091)
	java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
	java.util.concurrent.FutureTask.run(FutureTask.java:266)
	java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
	java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
	java.lang.Thread.run(Thread.java:748)

Caused By class java.lang.IllegalArgumentException:
Table TradeStock is not defined in namespace DXFeed
	io.deephaven.db.tables.databases.OnDiskDatabase.getRequiredTableDefinitionSchema(OnDiskDatabase.java:1381)
	io.deephaven.db.tables.databases.OnDiskDatabase.lambda$null$11(OnDiskDatabase.java:453)
	java.security.AccessController.doPrivileged(Native Method)
	io.deephaven.db.tables.databases.OnDiskDatabase.lambda$getIntradayTableV2$12(OnDiskDatabase.java:452)
	io.deephaven.db.tables.utils.QueryPerformanceRecorder.withNugget(QueryPerformanceRecorder.java:408)
	io.deephaven.db.tables.databases.OnDiskDatabase.getIntradayTableV2(OnDiskDatabase.java:449)
	io.deephaven.db.tables.databases.Database.getIntradayTableV2(Database.java:451)
	io.deephaven.db.tables.databases.Database.getIntradayTable(Database.java:425)
	io.deephaven.db.tables.databases.Database.i(Database.java:438)
	io.deephaven.db.tables.databases.Database$i.call(Unknown Source)
	org.codehaus.groovy.runtime.callsite.CallSiteArray.defaultCall(CallSiteArray.java:45)
	org.codehaus.groovy.runtime.callsite.AbstractCallSite.call(AbstractCallSite.java:108)
	org.codehaus.groovy.runtime.callsite.AbstractCallSite.call(AbstractCallSite.java:120)
	io.deephaven.db.util.dynamic.nullworker_13_2.run(nullworker_13_2.groovy:46)
	groovy.lang.GroovyShell.evaluate(GroovyShell.java:570)
	groovy.lang.GroovyShell.evaluate(GroovyShell.java:608)
	groovy.lang.GroovyShell.evaluate(GroovyShell.java:579)
	io.deephaven.db.util.IrisDbGroovySession.evaluateCommand(IrisDbGroovySession.java:219)
	io.deephaven.db.util.IrisDbGroovySession.lambda$evaluate$2(IrisDbGroovySession.java:249)
	io.deephaven.util.locks.FunctionalLock.doLockedInterruptibly(FunctionalLock.java:45)
	io.deephaven.db.util.IrisDbGroovySession.evaluate(IrisDbGroovySession.java:249)
	io.deephaven.console.events.RemoteScriptCommandQuery.execute(RemoteScriptCommandQuery.java:94)
	io.deephaven.console.events.RemoteScriptCommandQuery.execute(RemoteScriptCommandQuery.java:26)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$QueryAction.lambda$execute$0(RemoteQueryProcessor.java:1809)
	io.deephaven.util.locks.FunctionalLock.computeLockedInterruptibly(FunctionalLock.java:80)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$QueryAction.execute(RemoteQueryProcessor.java:1809)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler.runSyncQueryAndSendResult(RemoteQueryProcessor.java:1578)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler.handleCommandST(RemoteQueryProcessor.java:1482)
	io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler$HandleCommandRunnable.run(RemoteQueryProcessor.java:1091)
	java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
	java.util.concurrent.FutureTask.run(FutureTask.java:266)
	java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
	java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
	java.lang.Thread.run(Thread.java:748)
"}}`,
});
