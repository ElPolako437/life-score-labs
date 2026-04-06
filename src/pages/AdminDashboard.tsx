import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalinessLogo } from "@/components/CalinessLogo";
import { 
  LogOut, 
  Users, 
  Calendar, 
  Download, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Submission {
  id: string;
  email: string;
  firstname: string;
  answers: number[];
  score_total: number;
  user_age: number;
  result_level: string;
  gdpr_consent: boolean;
  meeting_booked: boolean;
  notes: string;
  created_at: string;
}

const CALENDLY_LINK = "https://calendly.com/team-calinessacademy/new-meeting";

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    resultLevel: "",
    meetingBooked: "",
    dateFrom: "",
    dateTo: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use sessionStorage for security (clears on tab close)
  const sessionToken = sessionStorage.getItem("adminSessionToken");

  useEffect(() => {
    verifyAndFetch();
  }, []);

  const verifyAndFetch = async () => {
    if (!sessionToken) {
      navigate("/admin");
      return;
    }

    try {
      const { data: verifyData } = await supabase.functions.invoke("admin-auth", {
        body: { action: "verify", sessionToken },
      });

      if (!verifyData?.valid) {
        sessionStorage.removeItem("adminSessionToken");
        navigate("/admin");
        return;
      }

      await fetchSubmissions();
    } catch (err) {
      console.error("Verify error:", err);
      navigate("/admin");
    }
  };

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const filterPayload: Record<string, unknown> = {};
      if (filters.resultLevel) filterPayload.resultLevel = filters.resultLevel;
      if (filters.meetingBooked) filterPayload.meetingBooked = filters.meetingBooked === "true";
      if (filters.dateFrom) filterPayload.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterPayload.dateTo = filters.dateTo;

      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "list", sessionToken, filters: filterPayload },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Failed to fetch");
      }

      setSubmissions(data?.submissions || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast({
        title: "Fehler",
        description: "Daten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.functions.invoke("admin-auth", {
      body: { action: "logout", sessionToken },
    });
    sessionStorage.removeItem("adminSessionToken");
    navigate("/admin");
  };

  const handleExport = async () => {
    const currentToken = sessionStorage.getItem("adminSessionToken");
    if (!currentToken) {
      navigate("/admin");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "export", sessionToken: currentToken },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Export failed");
      }

      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bioage-submissions-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export erfolgreich",
        description: "CSV-Datei wurde heruntergeladen",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    }
  };

  const handleMeetingToggle = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.functions.invoke("admin-data", {
        body: { action: "updateMeetingStatus", sessionToken, submissionId: id, meetingBooked: !currentStatus },
      });
      
      setSubmissions(prev => 
        prev.map(s => s.id === id ? { ...s, meeting_booked: !currentStatus } : s)
      );
      
      toast({
        title: "Status aktualisiert",
        description: !currentStatus ? "Meeting als gebucht markiert" : "Meeting-Status zurückgesetzt",
      });
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleGeneratePDF = async (submission: Submission) => {
    const currentToken = sessionStorage.getItem("adminSessionToken");
    if (!currentToken) {
      navigate("/admin");
      return;
    }

    setGeneratingPdfId(submission.id);

    try {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "generatePDF", sessionToken: currentToken, submissionId: submission.id },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "PDF generation failed");
      }

      const html = (data?.html as string | undefined) || "";
      const filename = (data?.filename as string | undefined) || `auswertung-${submission.firstname}.html`;

      if (!html) {
        throw new Error("No HTML returned");
      }

      // Always download the HTML file first (most reliable)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Auswertung heruntergeladen",
        description: (
          <div className="space-y-2">
            <p>Die Datei wurde heruntergeladen: <strong>{filename}</strong></p>
            <p className="text-xs text-muted-foreground">
              Öffne die Datei im Browser → Drucken (Strg+P) → Als PDF speichern
            </p>
          </div>
        ),
        duration: 8000,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({
        title: "Fehler",
        description: "Auswertung konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const getResultLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      foundation: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      awakening: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      momentum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      mastery: "bg-primary/20 text-primary border-primary/30",
    };
    
    const labels: Record<string, string> = {
      foundation: "Fundament (A)",
      awakening: "Erwachen (B)",
      momentum: "Momentum (C)",
      mastery: "Meisterschaft (D)",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[level] || "bg-muted"}`}>
        {labels[level] || level || "Unbekannt"}
      </span>
    );
  };

  const stats = {
    total: submissions.length,
    foundation: submissions.filter(s => s.result_level === "foundation").length,
    awakening: submissions.filter(s => s.result_level === "awakening").length,
    momentum: submissions.filter(s => s.result_level === "momentum").length,
    mastery: submissions.filter(s => s.result_level === "mastery").length,
    meetingsBooked: submissions.filter(s => s.meeting_booked).length,
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <CalinessLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
              <p className="text-text-muted text-sm">BioAge Test Auswertungen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(CALENDLY_LINK, "_blank")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendly
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              <p className="text-xs text-text-muted">Gesamt</p>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 mx-auto mb-2 flex items-center justify-center">
                <span className="text-orange-400 font-bold text-xs">A</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stats.foundation}</p>
              <p className="text-xs text-text-muted">Fundament</p>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 mx-auto mb-2 flex items-center justify-center">
                <span className="text-yellow-400 font-bold text-xs">B</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stats.awakening}</p>
              <p className="text-xs text-text-muted">Erwachen</p>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 mx-auto mb-2 flex items-center justify-center">
                <span className="text-blue-400 font-bold text-xs">C</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stats.momentum}</p>
              <p className="text-xs text-text-muted">Momentum</p>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-4 text-center">
              <div className="w-6 h-6 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">D</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stats.mastery}</p>
              <p className="text-xs text-text-muted">Meisterschaft</p>
            </CardContent>
          </Card>
          <Card className="card-elegant">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-text-primary">{stats.meetingsBooked}</p>
              <p className="text-xs text-text-muted">Meetings</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-elegant mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select
                value={filters.resultLevel || "all"}
                onValueChange={(value) => setFilters(f => ({ ...f, resultLevel: value === "all" ? "" : value }))}
              >
                <SelectTrigger className="bg-darker-surface/60">
                  <SelectValue placeholder="Ergebnis-Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="foundation">Fundament (A)</SelectItem>
                  <SelectItem value="awakening">Erwachen (B)</SelectItem>
                  <SelectItem value="momentum">Momentum (C)</SelectItem>
                  <SelectItem value="mastery">Meisterschaft (D)</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.meetingBooked || "all"}
                onValueChange={(value) => setFilters(f => ({ ...f, meetingBooked: value === "all" ? "" : value }))}
              >
                <SelectTrigger className="bg-darker-surface/60">
                  <SelectValue placeholder="Meeting-Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="true">Gebucht</SelectItem>
                  <SelectItem value="false">Nicht gebucht</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                placeholder="Von"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="bg-darker-surface/60"
              />
              
              <Input
                type="date"
                placeholder="Bis"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="bg-darker-surface/60"
              />
              
              <Button onClick={fetchSubmissions} className="glow-neon">
                Filter anwenden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-lg">Einreichungen</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-text-muted">
                Laden...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                Keine Einreichungen gefunden
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Datum</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Name</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">E-Mail</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Alter</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Score</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Level</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">DSGVO</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Meeting</th>
                      <th className="text-left py-3 px-2 text-text-muted font-medium">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-border/20 hover:bg-elevated-surface/30">
                        <td className="py-3 px-2 text-text-secondary">
                          {new Date(s.created_at).toLocaleDateString("de-DE")}
                        </td>
                        <td className="py-3 px-2 text-text-primary font-medium">
                          {s.firstname}
                        </td>
                        <td className="py-3 px-2 text-text-secondary">
                          {s.email}
                        </td>
                        <td className="py-3 px-2 text-text-secondary">
                          {s.user_age || "-"}
                        </td>
                        <td className="py-3 px-2 text-text-secondary">
                          {s.score_total || "-"}
                        </td>
                        <td className="py-3 px-2">
                          {getResultLevelBadge(s.result_level)}
                        </td>
                        <td className="py-3 px-2">
                          {s.gdpr_consent ? (
                            <CheckCircle className="w-4 h-4 text-primary" />
                          ) : (
                            <XCircle className="w-4 h-4 text-text-muted" />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMeetingToggle(s.id, s.meeting_booked)}
                            className={s.meeting_booked ? "text-primary" : "text-text-muted"}
                          >
                            {s.meeting_booked ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Calendar className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/evaluation/${s.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGeneratePDF(s)}
                              disabled={generatingPdfId === s.id}
                            >
                              {generatingPdfId === s.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Universal Calendly Link Info */}
        <Card className="card-elegant mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Universeller Meeting-Link</p>
                  <p className="text-xs text-text-muted">{CALENDLY_LINK}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(CALENDLY_LINK)}
              >
                Kopieren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
