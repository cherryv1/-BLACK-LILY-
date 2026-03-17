import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, Clock } from "lucide-react";

export default function LilyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const layerMetrics = trpc.lily.dashboard.getLayerMetrics.useQuery();
  const modelProviders = trpc.lily.dashboard.getModelProviders.useQuery();
  const recentLogs = trpc.lily.dashboard.getRecentLogs.useQuery({ limit: 50 });
  const alerts = trpc.lily.dashboard.getAlerts.useQuery({ status: "active" });

  useEffect(() => {
    const interval = setInterval(() => {
      layerMetrics.refetch();
      modelProviders.refetch();
      recentLogs.refetch();
      alerts.refetch();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      healthy: "bg-green-100 text-green-800",
      degraded: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
      offline: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Lily Edge AI Dashboard</h1>
          <p className="text-slate-400">Real-time monitoring of multi-model orchestration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Layers</p>
                  <p className="text-3xl font-bold text-white">{layerMetrics.data?.length || 0}</p>
                </div>
                <Activity className="text-blue-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">AI Models</p>
                  <p className="text-3xl font-bold text-white">{modelProviders.data?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Alerts</p>
                  <p className="text-3xl font-bold text-red-500">{alerts.data?.length || 0}</p>
                </div>
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Latency</p>
                  <p className="text-3xl font-bold text-green-500">45ms</p>
                </div>
                <Clock className="text-green-500" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="text-slate-300">Overview</TabsTrigger>
            <TabsTrigger value="models" className="text-slate-300">AI Models</TabsTrigger>
            <TabsTrigger value="logs" className="text-slate-300">Logs</TabsTrigger>
            <TabsTrigger value="alerts" className="text-slate-300">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Layer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {layerMetrics.data?.map((layer: any) => (
                    <div key={layer.layerName} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white capitalize">{layer.layerName}</h3>
                        {getStatusBadge(layer.status)}
                      </div>
                      <div className="space-y-1 text-sm text-slate-300">
                        <p>Latency: <span className="text-white">{layer.latency}ms</span></p>
                        <p>Throughput: <span className="text-white">{layer.throughput} req/s</span></p>
                        <p>Error Rate: <span className="text-white">{layer.errorRate}%</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">AI Model Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelProviders.data?.map((provider) => (
                    <div key={provider.name} className="bg-slate-700 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white capitalize">{provider.name}</h3>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Success Rate</p>
                          <p className="text-lg font-bold text-white">{provider.successRate}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Latency</p>
                          <p className="text-lg font-bold text-white">{provider.latency}ms</p>
                        </div>
                        {getStatusBadge(provider.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentLogs.data?.slice(0, 20).map((log: any) => (
                    <div key={log.requestId} className="bg-slate-700 p-3 rounded text-sm font-mono text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>{log.layerName}</span>
                        <span className={log.statusCode >= 400 ? "text-red-400" : "text-green-400"}>{log.statusCode}</span>
                        <span className="text-blue-400">{log.latency}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.data?.map((alert: any) => (
                    <div key={alert.id} className="bg-slate-700 p-4 rounded-lg border-l-4 border-red-500">
                      <h4 className="font-semibold text-white">{alert.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
