// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Importing a contract to assure that only the owner can change this contract.
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PongGameLedger
/// @author Uatilla Viana Almeida
/// @notice This contract manages tournament matches with creation and update functionality
/// @dev Only the contract owner can create or update matches
contract PongGameLedger is Ownable{
    /// @notice Structure representing a single match in a tournament
    struct Match {
        uint256 tournamentId;
        uint256 matchId;
        uint256 player1; //This could be the wallet address.
        uint256 player2; //The same.
        uint256 score1;
        uint256 score2;
        uint256 winner;
        uint256 startTime;
        uint256 endTime;
        bool    remoteMatch;
        bool    exists;
    }

    /// @notice Mapping to store matches: tournamentId => matchId => matchData
    mapping(uint256 tournamentId => mapping (uint256 matchId => Match matchData)) public matches;
    
    /// @notice Mapping to store match count for each tournament
    mapping(uint256 tournamentId => uint256 matchCount) public matchCountPerTournament;

    /// @notice Event emitted when a new match is created
    event MatchCreated(
        uint256 indexed tournamentId,
        uint256 indexed matchId,
        uint256 player1,
        uint256 player2,
        uint256 score1,
        uint256 score2,
        uint256 winner,
        uint256 startTime,
        uint256 endTime,
        bool    remoteMatch
    );
   
    /// @notice Structure helps associate a PlayerId with its matches
    struct MatchList{
        uint256 tournamentId;
        uint256 matchId;
    }

    /// @notice Mapping association playerId => array of match
    mapping(uint256 playerId => MatchList[] matchList) public matchesByPlayer;

    /// @notice Initializes the contract with the owner (msg.sender)
    constructor() Ownable(msg.sender) {}


    //Possible errors, to communicate off-chain.
    error InvalidPlayers();
    error InvalidWinner(uint256 winner);
    error InvalidTimeStamps();
    error MatchDoesNotExist(uint256 matchId);
    error TournamentDoesNotHaveMatches(uint256 tournamentId);
    error PlayerDoesNotHaveMatches(uint256 playerId);

    /// @notice This contract manages tournament matches with creation functionality
    function newMatch(
        uint256 tournamentId,
        uint256 player1,
        uint256 player2,
        uint256 score1,
        uint256 score2,
        uint256 winner,
        uint256 startTime,
        uint256 endTime,
        bool    remoteMatch
    ) public onlyOwner {
        if(player1 == player2) revert InvalidPlayers();
        if(winner != player1 && winner != player2) revert InvalidWinner(winner);
        if(startTime > endTime) revert InvalidTimeStamps();

        uint256 matchId = matchCountPerTournament[tournamentId];
        //Adding the data from the struct into the mapping.
        matches[tournamentId][matchId] = Match(
            tournamentId,
            matchId,
            player1,
            player2,
            score1,
            score2,
            winner,
            startTime,
            endTime,
            remoteMatch,
            true
        );

        // Adding the new match into the match list by player.
        MatchList memory newMatchData = MatchList({
            tournamentId: tournamentId,
            matchId: matchId
        });
        matchesByPlayer[player1].push(newMatchData);
        matchesByPlayer[player2].push(newMatchData);
        matchCountPerTournament[tournamentId]++;

        emit MatchCreated(tournamentId, matchId, player1, player2, score1, score2, winner, startTime, endTime, remoteMatch);
    }

    /// @notice Returns the number of matches for a specific tournament
    function getMatchCountPerTournament(uint256 tournamentId) public view returns (uint256 matchCount) {
        return matchCountPerTournament[tournamentId];
    }

    /// @notice Retrieves a match by tournament and match ID
    function getMatch(uint256 tournamentId, uint matchId) public view returns (
        uint256 tId,
        uint256 mId,
        uint256 pl1,
        uint256 pl2,
        uint256 scr1,
        uint256 scr2,
        uint256 win,
        uint256 sTime,
        uint256 eTime,
        bool    exists
    ) {
        Match memory m = matches[tournamentId][matchId];
        if(m.exists == false) revert MatchDoesNotExist(matchId);
        return (
            m.tournamentId,
            m.matchId,
            m.player1,
            m.player2,
            m.score1,
            m.score2,
            m.winner,
            m.startTime,
            m.endTime,
            m.exists
        );
    }

    /// @notice This function returns an array with all matches from a tournament.
    /// @return An array will all Match structs from the tournamentId.
    /// @dev Future versions it can have a pagination feature to be more gas efficient.
    function getMatchesByTournament(uint256 tournamentId)
        public view returns (Match[] memory){

            uint256 totalMatches = matchCountPerTournament[tournamentId];
            if (totalMatches == 0) revert TournamentDoesNotHaveMatches(tournamentId);
            Match[] memory result = new Match[](totalMatches);
            for (uint256 i = 0; i < totalMatches; i++){
                result[i] = matches[tournamentId][i];
            }
            return result;
        }

    /// @notice This function returns an array with all matches from a player
    /// @dev Future versions it can have a pagination feature to be more gas efficient
    function getMatchesByPlayer(uint playerId)
        public view returns (Match[] memory) {
            uint256 totalMatches = matchesByPlayer[playerId].length;
            if (totalMatches == 0) revert PlayerDoesNotHaveMatches(playerId);
            Match[] memory result = new Match[](totalMatches);
            for (uint256 i = 0; i < totalMatches; i++){
                MatchList memory matchList = matchesByPlayer[playerId][i];
                result[i] = matches[matchList.tournamentId][matchList.matchId];
            }
            return result;

        }

}