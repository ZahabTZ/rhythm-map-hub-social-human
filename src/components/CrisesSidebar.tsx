import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  Calendar,
  ExternalLink,
  X,
  Globe,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CrisesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrisesSidebar: React.FC<CrisesSidebarProps> = ({ 
  isOpen, 
  onClose
}) => {
  const navigate = useNavigate();
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Global humanitarian crises data
  const globalCrises = [
    {
      id: 'gaza-2024',
      name: 'Gaza Humanitarian Crisis',
      location: 'Gaza, Palestine',
      severity: 'Critical',
      affected: 2200000,
      category: 'Armed Conflict',
      lastUpdated: '2024-09-24',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      description: 'Ongoing humanitarian crisis affecting the entire population of Gaza with urgent need for medical supplies, food, and shelter.',
      status: 'Active'
    },
    {
      id: 'ukraine-2024',
      name: 'Ukraine Refugee Crisis',
      location: 'Ukraine & Neighboring Countries',
      severity: 'Critical',
      affected: 6000000,
      category: 'Armed Conflict',
      lastUpdated: '2024-09-23',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
      description: 'Millions displaced by ongoing conflict requiring international humanitarian assistance and refugee support.',
      status: 'Active'
    },
    {
      id: 'sudan-2024',
      name: 'Sudan Civil War Crisis',
      location: 'Sudan',
      severity: 'Critical',
      affected: 4500000,
      category: 'Armed Conflict',
      lastUpdated: '2024-09-22',
      image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
      description: 'Internal conflict has displaced millions with severe food insecurity and lack of basic services.',
      status: 'Active'
    },
    {
      id: 'afghanistan-2024',
      name: 'Afghanistan Humanitarian Crisis',
      location: 'Afghanistan',
      severity: 'High',
      affected: 28000000,
      category: 'Economic Collapse',
      lastUpdated: '2024-09-21',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      description: 'Economic collapse and restrictions on women have created widespread humanitarian needs.',
      status: 'Ongoing'
    },
    {
      id: 'syria-2024',
      name: 'Syria Refugee Crisis',
      location: 'Syria & Region',
      severity: 'High',
      affected: 13100000,
      category: 'Armed Conflict',
      lastUpdated: '2024-09-20',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
      description: 'Long-term displacement and destruction continue to affect millions across Syria and neighboring countries.',
      status: 'Ongoing'
    },
    {
      id: 'myanmar-2024',
      name: 'Myanmar Political Crisis',
      location: 'Myanmar',
      severity: 'High',
      affected: 1800000,
      category: 'Political Conflict',
      lastUpdated: '2024-09-19',
      image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop',
      description: 'Political instability has led to widespread displacement and humanitarian needs.',
      status: 'Ongoing'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCrisisClick = (crisis: any) => {
    navigate(`/crisis/${crisis.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-sm border-l shadow-xl z-20 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Global Humanitarian Crises</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Local/Global Toggle */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center bg-muted/50 rounded-full p-1">
              <button
                onClick={() => setIsLocalMode(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  !isLocalMode 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="button-global-mode-crises"
              >
                <Globe className="h-3 w-3" />
                Global
              </button>
              <button
                onClick={() => setIsLocalMode(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isLocalMode 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="button-local-mode-crises"
              >
                <User className="h-3 w-3" />
                Regional
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Click on any crisis to view details and get involved
          </p>
        </div>

        {/* Crisis List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {globalCrises.map((crisis) => (
            <Card 
              key={crisis.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCrisisClick(crisis)}
              data-testid={`crisis-card-${crisis.id}`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={crisis.image} />
                      <AvatarFallback className="bg-red-500/20 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{crisis.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(crisis.severity)}`}></div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        {crisis.location}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {crisis.affected.toLocaleString()} affected
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {crisis.category}
                    </Badge>
                    <Badge 
                      variant={crisis.status === 'Active' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {crisis.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {crisis.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {crisis.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Updated: {new Date(crisis.lastUpdated).toLocaleDateString()}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCrisisClick(crisis);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrisesSidebar;